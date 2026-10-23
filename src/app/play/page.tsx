import type { Metadata } from "next";
import { Arcade } from "@/components/arcade/arcade";
import "./play.css";

export const metadata: Metadata = { title: "一点小小的玩心", description: "七位老朋友，两场轻松的小冒险。", robots: { index: false, follow: false } };

export default function PlayPage() { return <Arcade />; }
