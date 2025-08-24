import dynamic from "next/dynamic";

const ElectroMapMVP = dynamic(
  () => import("@/features/electromap/ElectroMapMVP"),
  { ssr: false }
);

export default function Page() {
  return <ElectroMapMVP />;
}
