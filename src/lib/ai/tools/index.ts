import { contactTools } from "./contacts";
import { companyTools } from "./companies";
import { dealTools } from "./deals";
import { activityTools } from "./activities";

export function getCrmTools(tenantId: string, userId: string) {
  return {
    ...contactTools(tenantId),
    ...companyTools(tenantId),
    ...dealTools(tenantId),
    ...activityTools(tenantId, userId),
  };
}
