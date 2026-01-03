'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, Bell, Mail, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getUserNotificationSettings,
  updateNotificationSetting,
  deleteNotificationSetting,
} from '@/lib/api/notification';
import { useAuthStore } from '@/lib/stores/authStore';

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const userId = user?.id || '';

  // 알림 설정 조회
  const {
    data: settings = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['notificationSettings', userId],
    queryFn: () => getUserNotificationSettings(userId),
    enabled: !!userId,
  });

  // 알림 설정 토글 mutation
  const toggleMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      updateNotificationSetting(id, { isEnabled }),
    onSuccess: () => {
      toast.success('알림 설정이 업데이트되었습니다');
      queryClient.invalidateQueries({ queryKey: ['notificationSettings', userId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || '알림 설정 업데이트에 실패했습니다');
    },
  });

  // 알림 설정 삭제 mutation
  const deleteMutation = useMutation({
    mutationFn: deleteNotificationSetting,
    onSuccess: () => {
      toast.success('알림 설정이 삭제되었습니다');
      queryClient.invalidateQueries({ queryKey: ['notificationSettings', userId] });
    },
    onError: (error: Error) => {
      toast.error(error.message || '알림 설정 삭제에 실패했습니다');
    },
  });

  const handleToggle = (id: string, currentState: boolean) => {
    toggleMutation.mutate({ id, isEnabled: !currentState });
  };

  const handleDelete = (id: string) => {
    if (confirm('정말 이 알림 설정을 삭제하시겠습니까?')) {
      deleteMutation.mutate(id);
    }
  };

  const getChannelIcon = (channel: string) => {
    switch (channel.toLowerCase()) {
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'slack':
        return <MessageCircle className="h-4 w-4" />;
      default:
        return <Bell className="h-4 w-4" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'ranking_change': '순위 변동',
      'review_spike': '리뷰 급증',
      'rating_drop': '평점 하락',
      'competitor_update': '경쟁사 업데이트',
    };
    return labels[type] || type;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="pt-6">
            <p className="text-center text-destructive">
              알림 설정을 불러오는데 실패했습니다.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="h-8 w-8" />
              알림 설정
            </h1>
            <p className="text-muted-foreground mt-1">
              중요한 이벤트에 대한 알림을 관리하세요
            </p>
          </div>
          <Button disabled>
            <Plus className="h-4 w-4 mr-2" />
            알림 추가
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>등록된 알림 설정 ({settings.length}개)</CardTitle>
          <CardDescription>
            알림을 켜거나 끄려면 스위치를 토글하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          {settings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">등록된 알림 설정이 없습니다</p>
              <p className="text-sm">
                알림을 추가하여 중요한 변화를 놓치지 마세요
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>상태</TableHead>
                  <TableHead>알림 유형</TableHead>
                  <TableHead>채널</TableHead>
                  <TableHead>Place</TableHead>
                  <TableHead>조건</TableHead>
                  <TableHead className="text-right">작업</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {settings.map((setting) => (
                  <TableRow key={setting.id}>
                    <TableCell>
                      <Switch
                        checked={setting.isEnabled}
                        onCheckedChange={() =>
                          handleToggle(setting.id, setting.isEnabled)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {getNotificationTypeLabel(setting.notificationType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getChannelIcon(setting.channel)}
                        <span className="capitalize">{setting.channel}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {setting.placeName || (
                        <span className="text-muted-foreground">전체</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {setting.conditions ? (
                        <span>{JSON.stringify(setting.conditions)}</span>
                      ) : (
                        '없음'
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(setting.id)}
                        disabled={deleteMutation.isPending}
                      >
                        삭제
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>안내</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• 현재 알림 설정 기능은 기본 기능만 제공됩니다</p>
          <p>• 알림 추가 기능은 향후 업데이트될 예정입니다</p>
          <p>• 알림은 이메일 또는 Slack으로 전송됩니다</p>
        </CardContent>
      </Card>
    </div>
  );
}
