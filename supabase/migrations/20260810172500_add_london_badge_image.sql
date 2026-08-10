update public.app_membership_challenges
set badge_image_url = '/images/badges/london-marathon.png'
where is_badge = true and title = 'London Marathon';
