with community as (
  select id, created_by
  from public.app_membership_communities
  where id = 'a6dcbf1d-b7d3-4f70-a048-6f73bb46d1a1'
),
badges(title, description, goal_criteria, goal_value) as (
  values

  (
    'Tokyo Marathon',
    'A badge for runners who have taken on the Tokyo Marathon.',
    'Run the Tokyo Marathon.',
    42.195
  ),

  (
    'Boston Marathon',
    'A badge for runners who have taken on the Boston Marathon.',
    'Run the Boston Marathon.',
    42.195
  ),

  (
    'London Marathon',
    'A badge for runners who have taken on the London Marathon.',
    'Run the London Marathon.',
    42.195
  ),

  (
    'Sydney Marathon',
    'A badge for runners who have taken on the Sydney Marathon.',
    'Run the Sydney Marathon.',
    42.195
  ),

  (
    'Berlin Marathon',
    'A badge for runners who have taken on the Berlin Marathon.',
    'Run the Berlin Marathon.',
    42.195
  ),

  (
    'Chicago Marathon',
    'A badge for runners who have taken on the Chicago Marathon.',
    'Run the Chicago Marathon.',
    42.195
  ),

  (
    'New York City Marathon',
    'A badge for runners who have taken on the New York City Marathon.',
    'Run the New York City Marathon.',
    42.195
  ),

  (
    'Cape Town Marathon',
    'A badge celebrating the Cape Town Marathon experience.',
    'Run the Cape Town Marathon.',
    42.195
  ),

  (
    'Walt Disney World Marathon',
    'A badge for runners who complete the Walt Disney World Marathon.',
    'Run the Walt Disney World Marathon.',
    42.195
  ),

  (
    'Maratona do Rio',
    'A badge for runners who complete the Maratona do Rio.',
    'Run the Maratona do Rio.',
    42.195
  ),

  (
    'São Silvestre',
    'A badge for runners who take on the traditional São Silvestre road race.',
    'Run the São Silvestre.',
    15
  ),

  (
    'Six Star Finisher',
    'A special badge celebrating completion of the six original World Marathon Majors.',
    'Complete the six original World Marathon Majors.',
    6
  )
)

insert into public.app_membership_challenges (
  community_id,
  created_by,
  title,
  description,
  activity_type,
  goal_metric,
  goal_value,
  goal_criteria,
  deadline,
  points_active,
  points_late,
  runner_level,
  validation_method,
  is_active,
  is_badge,
  badge_image_url
)

select
  c.id,
  c.created_by,
  b.title,
  b.description,
  'run',
  'distance',
  b.goal_value,
  b.goal_criteria,
  '2099-12-31 23:59:59+00',
  0,
  0,
  null,
  'manual',
  true,
  true,
  null
from community c
cross join badges b
where not exists (
  select 1
  from public.app_membership_challenges existing
  where existing.community_id = c.id
    and existing.title = b.title
    and existing.is_badge = true
);
