-- Delete all duplicate folders for user, keeping only first Inbox and Archive
DELETE FROM folders 
WHERE user_id = '1eac61f7-5b90-434d-8b6e-983a41c73a9b' 
  AND id NOT IN ('532fa490-ad28-4ae2-855a-4350a9cababd', '844b1245-2fa8-46d1-9f66-31d3029767e8');