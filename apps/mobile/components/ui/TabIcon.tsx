import Svg, { Path } from "react-native-svg";

type Props = { focused: boolean; name: "explore" | "messages" | "bookings" | "profile" };

const color = (f: boolean) => (f ? "#111827" : "#9CA3AF");

export default function TabIcon({ focused, name }: Props) {
  const c = color(focused);
  const sw = focused ? 2 : 1.5;

  switch (name) {
    case "explore":
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path d="M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15zM21 21l-4.35-4.35" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "messages":
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "bookings":
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path d="M19 4H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V6a2 2 0 00-2-2zM16 2v4M8 2v4M3 10h18" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "profile":
      return (
        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
          <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
  }
}
