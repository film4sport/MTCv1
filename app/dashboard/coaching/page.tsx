import { redirect } from 'next/navigation';

// Coach's Panel removed — redirect to Lessons
export default function CoachingRedirect() {
  redirect('/dashboard/lessons');
}
