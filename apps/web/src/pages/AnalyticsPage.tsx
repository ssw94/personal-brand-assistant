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
  Grid,
  Stack,
  Typography,
} from '@mui/material';
import {
  decideInsight,
  generateInsights,
  listInsights,
  listMetrics,
} from '../lib/personalBrandApi';

export function AnalyticsPage() {
  const client = useQueryClient();
  const metrics = useQuery({ queryKey: ['analytics-metrics'], queryFn: listMetrics, retry: false });
  const insights = useQuery({
    queryKey: ['analytics-insights'],
    queryFn: listInsights,
    retry: false,
  });
  const generate = useMutation({
    mutationFn: generateInsights,
    onSuccess: () => void client.invalidateQueries({ queryKey: ['analytics-insights'] }),
  });
  const decide = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: 'ACCEPTED' | 'DISMISSED' }) =>
      decideInsight(id, decision),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['analytics-insights'] }),
  });
  if (metrics.isPending || insights.isPending)
    return <CircularProgress aria-label="Loading analytics" />;
  if (metrics.isError || insights.isError)
    return (
      <Alert severity="error">
        Analytics could not be loaded. {metrics.error?.message ?? insights.error?.message}
      </Alert>
    );
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="overline" color="primary">
          Analytics Intelligence
        </Typography>
        <Typography variant="h4" sx={{ fontWeight: 800 }}>
          Learn from what you publish
        </Typography>
        <Typography color="text.secondary">
          Only provider-confirmed metrics appear here. Unavailable LinkedIn capabilities remain
          unavailable.
        </Typography>
      </Box>
      <Grid container spacing={2}>
        {metrics.data.metrics.length === 0 ? (
          <Grid size={12}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">
                  No provider metrics have been received yet.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          metrics.data.metrics.slice(0, 6).map((metric) => (
            <Grid key={metric.id} size={{ xs: 12, sm: 6, md: 4 }}>
              <Card>
                <CardContent>
                  <Typography variant="caption" color="text.secondary">
                    {metric.metricName}
                  </Typography>
                  <Typography variant="h4" sx={{ fontWeight: 800 }}>
                    {metric.value}
                  </Typography>
                  <Typography variant="caption">
                    {metric.provider} · {metric.capability}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>
      <Card>
        <CardContent>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">Evidence-based insights</Typography>
              <Typography color="text.secondary">
                Insights suggest experiments; they do not claim causality.
              </Typography>
            </Box>
            <Button
              variant="outlined"
              onClick={() => generate.mutate()}
              disabled={generate.isPending}
            >
              {generate.isPending ? 'Analyzing…' : 'Generate insights'}
            </Button>
          </Stack>
          <Divider sx={{ my: 2 }} />
          {insights.data.insights.length === 0 ? (
            <Typography color="text.secondary">
              More than one comparable metric observation is needed.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {insights.data.insights.map((insight) => (
                <Box
                  key={insight.id}
                  sx={{ p: 1.5, border: 1, borderColor: 'divider', borderRadius: 2 }}
                >
                  <Stack direction="row" sx={{ justifyContent: 'space-between' }}>
                    <Box>
                      <Typography sx={{ fontWeight: 650 }}>{insight.summary}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Confidence: {Math.round(insight.confidence * 100)}%
                      </Typography>
                      {insight.feedback && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {insight.feedback.guidance}
                        </Typography>
                      )}
                    </Box>
                    <Chip label={insight.status} />
                  </Stack>
                  {insight.status === 'CANDIDATE' && (
                    <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                      <Button
                        size="small"
                        onClick={() => decide.mutate({ id: insight.id, decision: 'ACCEPTED' })}
                      >
                        Accept feedback
                      </Button>
                      <Button
                        size="small"
                        color="inherit"
                        onClick={() => decide.mutate({ id: insight.id, decision: 'DISMISSED' })}
                      >
                        Dismiss
                      </Button>
                    </Stack>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
