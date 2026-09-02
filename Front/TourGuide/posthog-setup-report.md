<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the CMU Campus Explorer app. The integration adds the `posthog-react-native` SDK with automatic screen tracking via Expo Router, a `PostHogProvider` wrapping the entire app, and 10 targeted custom events covering the core user journeys: building discovery (scanning), content engagement (summaries and chat), route completion, and feedback submission. Environment variables are managed via `.env` and exposed through `app.config.js` using `expo-constants`.

| Event | Description | File |
|---|---|---|
| `building_scanned` | User scanned a building — includes `building_id`, `is_new_unlock` | `app/camera.tsx` |
| `building_scan_failed` | Scan attempt failed (unrecognised image or error) — includes `reason` | `app/camera.tsx` |
| `building_summary_opened` | User opened the building summary modal — includes `building_id`, `building_name`, `is_new_unlock` | `components/SummaryModal.tsx` |
| `chat_started` | User tapped "Chat More" from a building summary — includes `building_id`, `building_name` | `components/SummaryModal.tsx` |
| `chat_message_sent` | User sent a message in the AI chat — includes `building_id`, `building_name`, `message_length` | `app/chat.tsx` |
| `route_selected` | User selected (or cleared) a tour route — includes `route_id`, `route_name`, `stop_count`, `previous_route_id` | `components/RoutePickerModal.tsx` |
| `route_completed` | User completed all stops on the active route — includes `route_name`, `stop_count` | `components/RouteCompletionModal.tsx` |
| `feedback_submitted` | User submitted feedback — includes `category`, `message_length`, `platform` | `components/FeedbackModal.tsx` |
| `map_expanded` | User opened the full-screen campus map | `app/(tabs)/index.tsx` |
| `building_card_tapped` | User tapped a building card in the All Buildings list — includes `building_id`, `building_name`, `is_unlocked` | `app/(tabs)/buildings.tsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics dashboard](/dashboard/1591750)
- [Building Scans Over Time](/insights/Olff4Ble) — daily scan volume split by new unlocks vs re-scans
- [Scan → Summary → Chat Conversion Funnel](/insights/2Y2zbbFb) — drop-off between scanning, reading, and chatting
- [Route Selection vs Completion](/insights/vFz1Pfud) — churn between starting and finishing a tour route
- [Feedback Submissions by Category](/insights/AiD1K2Qn) — bug reports, feedback, and other submissions over time
- [Scan Failure Rate](/insights/0Z6zvlFj) — successful vs failed scans to monitor AI recognition quality

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
