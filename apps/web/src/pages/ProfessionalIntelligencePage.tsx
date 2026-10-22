import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from '@mui/material';
import {
  extractMemory,
  getWritingStyle,
  listMemoryFacts,
  reviewMemory,
} from '../lib/personalBrandApi';

export function ProfessionalIntelligencePage() {
  const client = useQueryClient();
  const facts = useQuery({ queryKey: ['memory-facts'], queryFn: listMemoryFacts, retry: false });
  const style = useQuery({ queryKey: ['writing-style'], queryFn: getWritingStyle, retry: false });
  const extract = useMutation({
    mutationFn: extractMemory,
    onSuccess: () => void client.invalidateQueries({ queryKey: ['memory-facts'] }),
  });
  const review = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'VERIFIED' | 'REJECTED' }) =>
      reviewMemory(id, decision),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['memory-facts'] }),
  });
  if (facts.isPending || style.isPending)
    return <CircularProgress aria-label="Loading professional intelligence" />;
  if (facts.isError || style.isError)
    return (
      <Alert severity="error">
        Professional Intelligence could not be loaded.{' '}
        {facts.error?.message ?? style.error?.message}
      </Alert>
    );
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="overline" color="primary">
          Professional Intelligence
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Your facts, your voice
        </Typography>
        <Typography color="text.secondary">
          AI can propose candidates, but only you can verify what becomes trusted professional
          memory.
        </Typography>
      </Box>
      <Card>
        <CardContent>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">Professional Memory</Typography>
              <Typography color="text.secondary">
                Verified facts ground every future topic and draft.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() => extract.mutate()}
              disabled={extract.isPending}
            >
              {extract.isPending ? 'Extracting…' : 'Find candidates'}
            </Button>
          </Stack>
          <Divider sx={{ my: 2 }} />
          {facts.data.facts.length === 0 ? (
            <Typography color="text.secondary">
              No memory facts yet. Add profile and resume information, then extract candidates.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {facts.data.facts.map((fact) => (
                <Box
                  key={fact.id}
                  sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}
                >
                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    sx={{ justifyContent: 'space-between', gap: 1 }}
                  >
                    <Box>
                      <Typography sx={{ fontWeight: 650 }}>{fact.text}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {fact.category} · {fact.sourceType}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
                      <Chip
                        size="small"
                        label={fact.reviewState}
                        color={fact.reviewState === 'VERIFIED' ? 'success' : 'default'}
                      />
                      {fact.reviewState === 'CANDIDATE' && (
                        <>
                          <Button
                            size="small"
                            onClick={() => review.mutate({ id: fact.id, decision: 'VERIFIED' })}
                          >
                            Verify
                          </Button>
                          <Button
                            size="small"
                            color="inherit"
                            onClick={() => review.mutate({ id: fact.id, decision: 'REJECTED' })}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                    </Stack>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Typography variant="h6">Writing Style</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Your style profile is kept separate from factual memory.
          </Typography>
          {style.data.profile ? (
            <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
              <Chip label={`Tone: ${style.data.profile.tone}`} />
              <Chip label={`Formality: ${style.data.profile.formality}`} />
              <Chip label={`Sentence length: ${style.data.profile.sentenceLength}`} />
            </Stack>
          ) : (
            <Typography color="text.secondary">
              Add writing examples to build a style profile.
            </Typography>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
