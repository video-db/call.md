import { connect } from 'videodb';
import { createChildLogger } from '../lib/logger';
import { getAllRecordings, updateRecordingBySessionId } from '../db';
import { createInsightsService } from './insights.service';

const logger = createChildLogger('session-recovery');

interface RecoveryDetail {
  sessionId: string;
  status: 'recovered' | 'failed' | 'skipped';
  reason?: string;
}

export interface RecoveryResult {
  recovered: number;
  failed: number;
  skipped: number;
  details: RecoveryDetail[];
}

/**
 * Service to recover recordings that were exported by VideoDB while the app was closed.
 *
 * When the app is closed during the export process, the WebSocket listener is terminated
 * and the `capture_session.exported` event is missed. This service checks VideoDB for
 * any sessions that have completed export and updates the local database accordingly.
 */
export class SessionRecoveryService {
  private apiKey: string;
  private baseUrl?: string;

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  /**
   * Recover any recordings stuck in 'processing' status.
   * Called on app startup to handle sessions that exported while app was closed.
   */
  async recoverPendingSessions(): Promise<RecoveryResult> {
    const result: RecoveryResult = {
      recovered: 0,
      failed: 0,
      skipped: 0,
      details: [],
    };

    try {
      // 1. Get all recordings stuck in 'processing'
      const allRecordings = getAllRecordings();
      const pendingRecordings = allRecordings.filter(
        r => r.status === 'processing'
      );

      if (pendingRecordings.length === 0) {
        logger.info('No pending recordings to recover');
        return result;
      }

      logger.info(
        { count: pendingRecordings.length },
        'Found pending recordings to recover'
      );

      // 2. Connect to VideoDB and list capture sessions
      const conn = this.baseUrl
        ? connect({ apiKey: this.apiKey, baseUrl: this.baseUrl })
        : connect({ apiKey: this.apiKey });

      const collection = await conn.getCollection();

      // Fetch all capture sessions
      const captureSessions = await collection.listCaptureSessions();

      logger.info(
        { totalSessions: captureSessions.length },
        'Fetched capture sessions from VideoDB'
      );

      // Build a map of sessionId -> captureSession for quick lookup
      const sessionMap = new Map(
        captureSessions.map(s => [s.id, s])
      );

      // 3. Process each pending recording
      for (const recording of pendingRecordings) {
        const captureSession = sessionMap.get(recording.sessionId);

        if (!captureSession) {
          // Session not found in VideoDB - might be too old or different collection
          result.skipped++;
          result.details.push({
            sessionId: recording.sessionId,
            status: 'skipped',
            reason: 'Session not found in VideoDB',
          });
          logger.debug(
            { sessionId: recording.sessionId },
            'Session not found in VideoDB, skipping'
          );
          continue;
        }

        if (!captureSession.exportedVideoId) {
          // Session exists but hasn't exported yet - still processing server-side
          result.skipped++;
          result.details.push({
            sessionId: recording.sessionId,
            status: 'skipped',
            reason: `Session status: ${captureSession.status}, no exportedVideoId yet`,
          });
          logger.debug(
            { sessionId: recording.sessionId, status: captureSession.status },
            'Session has no exportedVideoId yet, skipping'
          );
          continue;
        }

        // 4. Session has exported! Fetch video details
        try {
          logger.info(
            { sessionId: recording.sessionId, exportedVideoId: captureSession.exportedVideoId },
            'Recovering session with exported video'
          );

          const video = await collection.getVideo(captureSession.exportedVideoId);

          // Parse duration from video.length (it's a string like "123.45")
          let duration: number | null = null;
          if (video.length) {
            const parsed = parseFloat(video.length);
            if (!isNaN(parsed)) {
              duration = Math.round(parsed);
            }
          }

          // 5. Update the recording in DB
          const updated = updateRecordingBySessionId(recording.sessionId, {
            videoId: captureSession.exportedVideoId,
            streamUrl: video.streamUrl || null,
            playerUrl: video.playerUrl || null,
            duration,
            status: 'available',
            insightsStatus: 'pending',
          });

          if (updated) {
            logger.info(
              {
                sessionId: recording.sessionId,
                recordingId: updated.id,
                videoId: captureSession.exportedVideoId,
                streamUrl: video.streamUrl,
                playerUrl: video.playerUrl,
              },
              'Recording recovered successfully'
            );

            result.recovered++;
            result.details.push({
              sessionId: recording.sessionId,
              status: 'recovered',
            });

            // 6. Kick off insights processing (fire and forget)
            this.triggerInsightsProcessing(
              updated.id,
              captureSession.exportedVideoId
            );
          } else {
            logger.warn(
              { sessionId: recording.sessionId },
              'Failed to update recording in database'
            );
            result.failed++;
            result.details.push({
              sessionId: recording.sessionId,
              status: 'failed',
              reason: 'Database update returned null',
            });
          }
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : String(error);
          logger.error(
            { sessionId: recording.sessionId, error: errorMsg },
            'Failed to recover recording'
          );

          result.failed++;
          result.details.push({
            sessionId: recording.sessionId,
            status: 'failed',
            reason: errorMsg,
          });
        }
      }

      logger.info(
        { recovered: result.recovered, failed: result.failed, skipped: result.skipped },
        'Session recovery complete'
      );
      return result;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error({ error: errorMsg }, 'Session recovery failed');
      throw error;
    }
  }

  private triggerInsightsProcessing(recordingId: number, videoId: string): void {
    const insightsService = createInsightsService(this.apiKey, this.baseUrl);

    insightsService
      .processRecording(recordingId, videoId)
      .then((result) => {
        logger.info(
          { recordingId, success: result.success },
          'Insights processing completed for recovered recording'
        );
      })
      .catch((error) => {
        const errorMsg = error instanceof Error ? error.message : String(error);
        logger.error(
          { error: errorMsg, recordingId },
          'Insights processing failed for recovered recording'
        );
      });
  }
}

export function createSessionRecoveryService(
  apiKey: string,
  baseUrl?: string
): SessionRecoveryService {
  return new SessionRecoveryService(apiKey, baseUrl);
}
