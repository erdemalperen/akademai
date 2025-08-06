import React from 'react';
import { BellRing, Calendar, Info } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import Button from '../ui/Button';
import { mockAnnouncements } from '../../utils/mockData';

const AnnouncementList: React.FC = () => {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">Duyurular</CardTitle>
        <Button variant="outline" size="sm" className="h-8">
          Tümünü Gör
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockAnnouncements.map((announcement) => {
            const date = new Date(announcement.createdAt);
            const formattedDate = new Intl.DateTimeFormat('tr-TR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            }).format(date);
            
            return (
              <div
                key={announcement.id}
                className={`flex items-start space-x-4 rounded-md border p-3 transition-colors ${
                  announcement.important
                    ? 'border-error/30 bg-error/10 hover:bg-error/15'
                    : 'border-border bg-card hover:bg-muted/50'
                }`}
              >
                <div className={`p-2 rounded-full ${
                  announcement.important
                    ? 'bg-error/20 text-error'
                    : 'bg-muted/70 text-muted-foreground'
                }`}>
                  {announcement.important ? (
                    <BellRing className="h-5 w-5" />
                  ) : (
                    <Info className="h-5 w-5" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className={`font-medium ${
                      announcement.important ? 'text-error' : ''
                    }`}>
                      {announcement.title}
                    </h4>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 mr-1" />
                      {formattedDate}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {announcement.content}
                  </p>
                </div>
              </div>
            );
          })}
          
          {mockAnnouncements.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Info className="h-10 w-10 text-muted-foreground mb-2" />
              <h3 className="text-lg font-medium">Duyuru Bulunamadı</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Şu anda görüntülenecek duyuru bulunmamaktadır.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnnouncementList;