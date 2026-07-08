import { getSessionAgency } from "@/lib/data/session";
import { StartAgencyButton } from "../start-agency-button";
import { AccountForm } from "./account-form";

export default async function AgencyAccountPage() {
  const agency = await getSessionAgency();

  if (!agency) {
    return (
      <div className="max-w-xl rounded-2xl border border-brand-200 bg-brand-50 p-6">
        <p className="text-sm font-bold text-brand-700">
          아직 소속사 계정이 없어요 (테스터 보기)
        </p>
        <p className="mt-1 text-sm text-brand-700/80">
          소속사로 시작하면 계정·요금제를 설정하고 내 아티스트를 관리할 수
          있어요.
        </p>
        <div className="mt-3">
          <StartAgencyButton />
        </div>
      </div>
    );
  }

  return <AccountForm agency={agency} />;
}
