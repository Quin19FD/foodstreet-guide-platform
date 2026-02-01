/**
 * Home Page
 *
 * Landing page with full feature showcase.
 */

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { QrCode, MapPin, Headphones, ShoppingCart } from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 to-background py-20 md:py-32">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              Khám phá Ẩm Thực Đường Phố
            </h1>
            <p className="mb-8 text-lg text-muted-foreground md:text-xl">
              Quét mã QR để khám phá các gian hàng ẩm thực, nghe thuyết minh đa ngôn ngữ và đặt
              món trực tiếp trên ứng dụng.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" asChild>
                <Link href="/scan">
                  <QrCode className="mr-2 h-5 w-5" />
                  Quét QR Code
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/districts">
                  <MapPin className="mr-2 h-5 w-5" />
                  Tìm khu phố
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-20 -top-20 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -right-20 -bottom-20 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">
            Tính năng nổi bật
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <QrCode className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Quét QR kích hoạt</h3>
              <p className="text-muted-foreground">
                Quét mã QR tại khu phố để kích hoạt nội dung hướng dẫn ẩm thực.
              </p>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <MapPin className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Định vị GPS</h3>
              <p className="text-muted-foreground">
                Tự động nhận diện vị trí và gợi ý các gian hàng gần nhất.
              </p>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Headphones className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Thuyết minh đa ngôn ngữ</h3>
              <p className="text-muted-foreground">
                Nghe giới thiệu về từng món ăn bằng giọng nói tự nhiên.
              </p>
            </Card>

            <Card className="p-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <ShoppingCart className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">Đặt món trực tuyến</h3>
              <p className="text-muted-foreground">
                Xem menu, đặt món và thanh toán qua VietQR hoặc VNPay.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted/50 py-16 md:py-24">
        <div className="container">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight md:text-4xl">
            Cách sử dụng
          </h2>
          <div className="mx-auto max-w-3xl">
            <ol className="space-y-8">
              {[
                {
                  step: '1',
                  title: 'Quét mã QR',
                  description: 'Tìm và quét mã QR được đặt tại khu phố ẩm thực.',
                },
                {
                  step: '2',
                  title: 'Khám phá gian hàng',
                  description:
                    'Xem danh sách các gian hàng ẩm thực xung quanh vị trí của bạn.',
                },
                {
                  step: '3',
                  title: 'Nghe thuyết minh',
                  description:
                    'Chọn gian hàng để nghe giới thiệu chi tiết về các món ăn đặc sắc.',
                },
                {
                  step: '4',
                  title: 'Đặt và thanh toán',
                  description:
                    'Đặt món trực tiếp trên app và thanh toán qua QR Code hoặc cổng thanh toán.',
                },
              ].map((item) => (
                <li key={item.step} className="flex gap-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="mb-1 text-xl font-semibold">{item.title}</h3>
                    <p className="text-muted-foreground">{item.description}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24">
        <div className="container">
          <Card className="overflow-hidden bg-gradient-to-r from-primary to-primary/80 p-8 text-primary-foreground md:p-12">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold md:text-4xl">
                Sẵn sàng khám phá ẩm thực đường phố?
              </h2>
              <p className="mb-8 text-lg opacity-90">
                Tải ứng dụng hoặc truy cập web để bắt đầu hành trình ẩm thực của bạn.
              </p>
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button size="lg" variant="secondary" asChild>
                  <Link href="/scan">Bắt đầu ngay</Link>
                </Button>
                <Button size="lg" variant="outline" className="bg-transparent text-white hover:bg-white/10" asChild>
                  <Link href="/about">Tìm hiểu thêm</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
