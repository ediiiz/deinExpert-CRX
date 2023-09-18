const PUBLIC_CLOUDFLARE_WORKER_API_KEY = "2079279f-840b-4f10-9dc0-0cee850b3eee"
const PUBLIC_LINKOMAT_API_KEY = "bG9jYWxlPSZ1aWQ9NDc0MTkmc2VydmljZVByb3ZpZGVyPUFXSU5fQUxMX0RFJnNlcnZpY2VQcm92aWRlcklkPTMwMDA3JnRyYWNraW5nTGluaz0="

enum Routes {
  LINKOMAT_BASE = 'https://api.link-o-mat.com/redirectWebsite.php?data=',
  CORS_PROXY = 'https://cashback.dztf.workers.dev/?',
}

interface HeadersObject {
  'X-Requested-With': string;
  'x-cors-headers': string;
  [key: string]: string;
}

export async function getLinkomatAwin(): Promise<string | void> {
  const linkomatUrl = `${Routes.LINKOMAT_BASE}${PUBLIC_LINKOMAT_API_KEY}`;
  const headers: HeadersObject = {
    'X-Requested-With': 'XMLHttpRequest',
    'X-API-KEY': PUBLIC_CLOUDFLARE_WORKER_API_KEY,
    'x-cors-headers': JSON.stringify({
      Referer: linkomatUrl,
      'Access-Control-Allow-Origin': '*',
    }),
  };

  const requestOptions: RequestInit = {
    headers,
    redirect: 'follow',
    method: 'POST',
  };

  const fetchWithCors = async (url: string) => {
    return await fetch(`${Routes.CORS_PROXY}${url}`, requestOptions);
  };

  const response = await fetchWithCors(`${linkomatUrl}&ab=0`);
  const rshopResponse = await fetchWithCors(response.headers.get('location')!);
  const earnCashbackElement = new DOMParser()
    .parseFromString(await rshopResponse.text(), 'text/html')
    .querySelector<HTMLAnchorElement>('html body a')?.href;
  const lomlinkResponse = await fetchWithCors(earnCashbackElement!);
  const awinLink = lomlinkResponse.headers.get('location')!;
  return awinLink;
}
