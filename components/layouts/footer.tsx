import { QrCode } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t bg-muted/40">
      <div className="container py-8 md:py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <QrCode className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold">FoodStreet Guide</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Khám phá ẩm thực đường phố thông minh với QR Code và GPS.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Khám phá</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/districts" className="text-muted-foreground hover:text-foreground">
                  Khu phố ẩm thực
                </Link>
              </li>
              <li>
                <Link href="/scan" className="text-muted-foreground hover:text-foreground">
                  Quét QR Code
                </Link>
              </li>
              <li>
                <Link href="/map" className="text-muted-foreground hover:text-foreground">
                  Bản đồ
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Hỗ trợ</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground">
                  Về chúng tôi
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-muted-foreground hover:text-foreground">
                  Trợ giúp
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-muted-foreground hover:text-foreground">
                  Liên hệ
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Pháp lý</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground">
                  Điều khoản sử dụng
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground">
                  Chính sách bảo mật
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} FoodStreet Guide. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
