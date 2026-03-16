import Svg, { Path } from "react-native-svg";

type IconName = "explore" | "favorites" | "trips" | "messages" | "profile";
type Props = { focused: boolean; name: IconName };

const ACTIVE = "#F43F5E";
const INACTIVE = "#6B7280";

export default function TabIcon({ focused, name }: Props) {
  const c = focused ? ACTIVE : INACTIVE;
  const sw = focused ? 2 : 1.5;

  switch (name) {
    case "explore":
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path d="M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15zM21 21l-4.35-4.35" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "favorites":
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill={focused ? ACTIVE : "none"}>
          <Path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "trips":
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
          <Path d="M12 13a3 3 0 100-6 3 3 0 000 6z" stroke={c} strokeWidth={sw} />
        </Svg>
      );
    case "messages":
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2v10z" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
    case "profile":
      return (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" stroke={c} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );
  }
}
