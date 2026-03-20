import { redirect } from 'next/navigation';
import { APP_ROUTES } from '../../lib/site';

// Coach's Panel removed — redirect to Lessons
export default function CoachingRedirect() {
  redirect(APP_ROUTES.dashboardLessons);
}
