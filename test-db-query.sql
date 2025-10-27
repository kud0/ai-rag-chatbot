-- Check documents ownership
SELECT
  d.id,
  d.title,
  d.user_id,
  COUNT(dc.id) as chunk_count,
  SUM(CASE WHEN dc.embedding IS NOT NULL THEN 1 ELSE 0 END) as chunks_with_embeddings
FROM documents d
LEFT JOIN document_chunks dc ON dc.document_id = d.id
GROUP BY d.id, d.title, d.user_id
ORDER BY d.created_at DESC;

-- Check if there's a user mismatch
SELECT DISTINCT user_id FROM documents;
