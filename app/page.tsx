import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-4">ElectroMap</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Карта объектов</CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/map"><Button>Открыть карту</Button></Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Объекты</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled>
              Просмотреть объекты
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Ремонты и аварии</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled>
              Открыть журнал
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Сообщения</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled>
              Перейти к чату
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Профиль</CardTitle>
          </CardHeader>
          <CardContent>
            <Button variant="outline" disabled>
              Профиль пользователя
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
