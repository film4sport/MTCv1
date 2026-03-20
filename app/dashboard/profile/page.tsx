import { redirect } from 'next/navigation';
import { APP_ROUTES } from '../../lib/site';

export default function ProfileRedirect() {
  redirect(APP_ROUTES.dashboardSettings);
}
