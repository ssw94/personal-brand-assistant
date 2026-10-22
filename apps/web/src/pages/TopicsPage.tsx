import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { generateTopics, listTopics, reviewTopic } from '../lib/personalBrandApi';

export function TopicsPage() {
  const [focus, setFocus] = useState('');
  const client = useQueryClient();
  const topics = useQuery({ queryKey: ['topic-candidates'], queryFn: listTopics, retry: false });
  const generate = useMutation({
    mutationFn: () => generateTopics(focus),
    onSuccess: () => {
      setFocus('');
      void client.invalidateQueries({ queryKey: ['topic-candidates'] });
    },
  });
  const review = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'SELECTED' | 'REJECTED' }) =>
      reviewTopic(id, decision),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['topic-candidates'] }),
  });
  if (topics.isPending) return <CircularProgress aria-label="Loading topics" />;
  if (topics.isError)
    return <Alert severity="error">Topics could not be loaded. {topics.error.message}</Alert>;
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="overline" color="primary">
          Topic Lab
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Choose what to say next
        </Typography>
        <Typography color="text.secondary">
          Candidates are grounded in verified memory and safe research, then reviewed by you before
          writing.
        </Typography>
      </Box>
      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <TextField
              fullWidth
              label="Focus (optional)"
              value={focus}
              onChange={(event) => setFocus(event.target.value)}
              placeholder="e.g. lessons from platform migration"
            />
            <Button
              variant="contained"
              onClick={() => generate.mutate()}
              disabled={generate.isPending}
            >
              {generate.isPending ? 'Generating…' : 'Generate topics'}
            </Button>
          </Stack>
        </CardContent>
      </Card>
      <Stack spacing={2}>
        {topics.data.candidates.length === 0 ? (
          <Typography color="text.secondary">
            No candidates yet. Generate a small set to begin.
          </Typography>
        ) : (
          topics.data.candidates.map((topic) => (
            <Card key={topic.id}>
              <CardContent>
                <Stack direction="row" sx={{ justifyContent: 'space-between', gap: 2 }}>
                  <Box>
                    <Typography variant="h6">{topic.title}</Typography>
                    <Typography color="text.secondary" sx={{ mt: 1 }}>
                      {topic.angle}
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      {topic.rationale}
                    </Typography>
                  </Box>
                  <Chip label={topic.status} />
                </Stack>
                {topic.status === 'CANDIDATE' && (
                  <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => review.mutate({ id: topic.id, decision: 'SELECTED' })}
                    >
                      Use this topic
                    </Button>
                    <Button
                      size="small"
                      onClick={() => review.mutate({ id: topic.id, decision: 'REJECTED' })}
                    >
                      Dismiss
                    </Button>
                  </Stack>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </Stack>
    </Stack>
  );
}
