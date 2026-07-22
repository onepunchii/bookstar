import { DeleteAccountButton } from "@/components/delete-account-button";
import { getSessionAgency } from "@/lib/data/session";
import { getT } from "@/lib/i18n/server";
import { StartAgencyButton } from "../start-agency-button";
import { AccountForm } from "./account-form";

export default async function AgencyAccountPage() {
  const { t } = await getT();
  const agency = await getSessionAgency();

  if (!agency) {
    return (
      <div className="max-w-xl rounded-2xl border border-brand-200 bg-brand-50 p-6">
        <p className="text-sm font-bold text-brand-700">
          {t("agency.account.noAccountTitle")}
        </p>
        <p className="mt-1 text-sm text-brand-700/80">
          {t("agency.account.noAccountDesc")}
        </p>
        <div className="mt-3">
          <StartAgencyButton />
        </div>
      </div>
    );
  }

  return (
    <>
      <AccountForm agency={agency} />
      <div className="mt-6 border-t border-neutral-100 pt-4">
        <DeleteAccountButton />
      </div>
    </>
  );
}
