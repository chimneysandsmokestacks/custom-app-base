import { copilotApi } from "copilot-node-sdk";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const copilot = copilotApi({
	  apiKey: COPILOT_API_KEY,
	  token: "token" in searchParams && typeof searchParams.token === "string"
      ? searchParams.token
      : undefined,
  });
};