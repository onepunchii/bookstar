// 네이티브 앱 푸시 발송 — shell-kit 표준(농사/mapix 이식). SDK 의존성 없이 손수 배선.
// 안드로이드 = FCM HTTP v1(서비스계정 JWT), iOS = APNs HTTP/2(p8 ES256 JWT) 직접 호출.
// env 없으면 조용히 비활성: FIREBASE_SERVICE_ACCOUNT(JSON 문자열),
// APNS_KEY / APNS_KEY_ID / APNS_TEAM_ID / APNS_TOPIC(=kr.co.xong.app). booking은 neon 직접 SQL.
import { neon } from "@neondatabase/serverless";

export type PushPayload = { title: string; body: string; url?: string; tag?: string };
type TokenRow = { token: string; platform: string };

function sql() { return neon(process.env.DATABASE_URL!); }

/* ── FCM (안드로이드) ── */
type SA = { project_id: string; client_email: string; private_key: string };
let sa: SA | null | undefined;
let fcmToken: { token: string; exp: number } | null = null;

function serviceAccount(): SA | null {
  if (sa !== undefined) return sa;
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
    sa = raw ? (JSON.parse(raw) as SA) : null;
  } catch { sa = null; }
  return sa;
}

async function fcmAccessToken(acc: SA): Promise<string | null> {
  if (fcmToken && Date.now() < fcmToken.exp) return fcmToken.token;
  const now = Math.floor(Date.now() / 1000);
  const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${enc({ alg: "RS256", typ: "JWT" })}.${enc({
    iss: acc.client_email,
    scope: "https://www.googleapis.com/auth/firebase.messaging",
    aud: "https://oauth2.googleapis.com/token",
    iat: now, exp: now + 3600,
  })}`;
  const { createSign } = await import("node:crypto");
  const sig = createSign("RSA-SHA256").update(unsigned).sign(acc.private_key, "base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=${encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer")}&assertion=${unsigned}.${sig}`,
  });
  if (!res.ok) return null;
  const j = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!j.access_token) return null;
  fcmToken = { token: j.access_token, exp: Date.now() + ((j.expires_in ?? 3600) - 600) * 1000 };
  return j.access_token;
}

/* ── APNs (iOS) ── */
let apnsJwtCache: { token: string; exp: number } | null = null;

function apnsConf() {
  const key = process.env.APNS_KEY;
  const keyId = process.env.APNS_KEY_ID;
  const teamId = process.env.APNS_TEAM_ID;
  const topic = process.env.APNS_TOPIC; // 미설정이면 iOS 발송 비활성(잘못된 토픽 방지)
  if (!key || !keyId || !teamId || !topic) return null;
  return { key: key.replace(/\\n/g, "\n"), keyId, teamId, topic };
}

async function apnsJwt(c: NonNullable<ReturnType<typeof apnsConf>>): Promise<string> {
  if (apnsJwtCache && Date.now() < apnsJwtCache.exp) return apnsJwtCache.token;
  const now = Math.floor(Date.now() / 1000);
  const enc = (o: object) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const unsigned = `${enc({ alg: "ES256", kid: c.keyId })}.${enc({ iss: c.teamId, iat: now })}`;
  const { createSign } = await import("node:crypto");
  const sig = createSign("SHA256").update(unsigned).sign({ key: c.key, dsaEncoding: "ieee-p1363" }, "base64url");
  const token = `${unsigned}.${sig}`;
  apnsJwtCache = { token, exp: Date.now() + 45 * 60 * 1000 };
  return token;
}

function h2Post(host: string, path: string, headers: Record<string, string>, body: string): Promise<{ status: number; body: string }> {
  return new Promise((resolve, reject) => {
    import("node:http2").then((http2) => {
      const client = http2.connect(`https://${host}`);
      client.on("error", reject);
      const req = client.request({ ":method": "POST", ":path": path, ...headers });
      let status = 0;
      let data = "";
      req.on("response", (h) => { status = Number(h[":status"] ?? 0); });
      req.setEncoding("utf8");
      req.on("data", (c) => { data += c; });
      req.on("end", () => { client.close(); resolve({ status, body: data }); });
      req.on("error", (e) => { client.close(); reject(e); });
      req.end(body);
    }).catch(reject);
  });
}

// 토큰 목록에 발송(공통). android=FCM, ios=APNs. 만료 토큰 정리.
async function sendToTokens(rows: TokenRow[], payload: PushPayload): Promise<{ android: number; ios: number }> {
  const out = { android: 0, ios: 0 };
  const dead: string[] = [];
  const acc = serviceAccount();
  const androidTokens = rows.filter((r) => r.platform === "android");
  if (acc && androidTokens.length) {
    const at = await fcmAccessToken(acc);
    if (at) {
      const url = `https://fcm.googleapis.com/v1/projects/${acc.project_id}/messages:send`;
      await Promise.allSettled(androidTokens.map(async (r) => {
        const res = await fetch(url, {
          method: "POST",
          headers: { Authorization: `Bearer ${at}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            message: {
              token: r.token,
              notification: { title: payload.title, body: payload.body },
              data: { url: payload.url ?? "/" },
              android: { notification: { tag: payload.tag ?? undefined, icon: "ic_stat_notify", color: "#F45B0A" } },
            },
          }),
        });
        if (res.ok) out.android++;
        else if (res.status === 404 || res.status === 400) dead.push(r.token);
      }));
    }
  }
  const c = apnsConf();
  const iosTokens = rows.filter((r) => r.platform === "ios");
  if (c && iosTokens.length) {
    const jwt = await apnsJwt(c);
    const body = JSON.stringify({
      aps: { alert: { title: payload.title, body: payload.body }, sound: "default", ...(payload.tag ? { "thread-id": payload.tag } : {}) },
      url: payload.url ?? "/",
    });
    const headers = {
      authorization: `bearer ${jwt}`,
      "apns-topic": c.topic,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    };
    await Promise.allSettled(iosTokens.map(async (r) => {
      let res = await h2Post("api.push.apple.com", `/3/device/${r.token}`, headers, body);
      if (res.status === 400 && res.body.includes("BadDeviceToken")) {
        res = await h2Post("api.sandbox.push.apple.com", `/3/device/${r.token}`, headers, body);
      }
      if (res.status === 200) out.ios++;
      else if (res.status === 410 || (res.status === 400 && res.body.includes("BadDeviceToken"))) dead.push(r.token);
    }));
  }
  if (dead.length) {
    await sql()`DELETE FROM native_push_tokens WHERE token = ANY(${dead})`.catch(() => {});
  }
  return out;
}

// 특정 유저에게 발송 — 예약 요청/메시지 알림 등. 유저 토큰 조회 후 발송.
export async function pushToUser(userId: string, payload: PushPayload): Promise<{ android: number; ios: number }> {
  try {
    const rows = (await sql()`SELECT token, platform FROM native_push_tokens WHERE user_id = ${userId}`) as TokenRow[];
    if (!rows.length) return { android: 0, ios: 0 };
    return await sendToTokens(rows, payload);
  } catch (e) {
    console.error("[push-native] pushToUser", (e as Error)?.message);
    return { android: 0, ios: 0 };
  }
}

// 전 기기 브로드캐스트 — 공지 등.
export async function broadcastNative(payload: PushPayload): Promise<{ android: number; ios: number }> {
  try {
    const rows = (await sql()`SELECT token, platform FROM native_push_tokens`) as TokenRow[];
    if (!rows.length) return { android: 0, ios: 0 };
    return await sendToTokens(rows, payload);
  } catch (e) {
    console.error("[push-native] broadcast", (e as Error)?.message);
    return { android: 0, ios: 0 };
  }
}
