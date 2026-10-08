import { Outfit, Ovo } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-outfit",
});

const ovo = Ovo({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-ovo",
});

export const metadata = {
  title: "RPLG ICN",
  description: "RPLG 2024-2027",
  icons: {
    icon: [
      {
        url: '/icon-light.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark.png',
        media: '(prefers-color-scheme: dark)',
      },
    ],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en" className="scroll-smooth"

    >
      <body className={`${outfit.variable} ${ovo.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
