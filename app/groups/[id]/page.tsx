"use client";

import { useParams } from "next/navigation";
import FreeRunClubPage from "./FreeRunClubPage";
import OriginalMembershipPage from "./OriginalMembershipPage";

export default function MembershipPage() {
  const params = useParams();
  const communityId = params?.id;

  if (communityId === "a6dcbf1d-b7d3-4f70-a048-6f73bb46d1a1") {
    return <FreeRunClubPage />;
  }

  return <OriginalMembershipPage />;
}
