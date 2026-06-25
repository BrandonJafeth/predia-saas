import 'dotenv/config';
import { LocationType, PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const BASE_URL = 'https://ubicaciones.paginasweb.cr';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} — ${url}`);
  return res.json() as Promise<T>;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// Costa Rica postal codes: PCCDD (5 digits)
// Province P → P0000  (e.g. San José = 10000)
// Canton  C in P → PCC00  (e.g. Central = 10100)
// District D in C in P → PCCDD  (e.g. Carmen = 10101)
function pCode(p: number) {
  return `${p}0000`;
}
function cCode(p: number, c: number) {
  return `${p}${String(c).padStart(2, '0')}00`;
}
function dCode(p: number, c: number, d: number) {
  return `${p}${String(c).padStart(2, '0')}${String(d).padStart(2, '0')}`;
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Fetching provinces...');
    const provinces = await fetchJson<Record<string, string>>(`${BASE_URL}/provincias.json`);

    let totalProvinces = 0;
    let totalCantons = 0;
    let totalDistricts = 0;

    for (const [pId, pName] of Object.entries(provinces)) {
      const pid = parseInt(pId);

      const province = await prisma.location.upsert({
        where: { code: pCode(pid) },
        create: { name: pName, code: pCode(pid), type: LocationType.province },
        update: { name: pName },
      });
      totalProvinces++;
      console.log(`[${pCode(pid)}] ${pName}`);

      await sleep(80);
      const cantons = await fetchJson<Record<string, string>>(
        `${BASE_URL}/provincia/${pid}/cantones.json`,
      );

      for (const [cId, cName] of Object.entries(cantons)) {
        const cid = parseInt(cId);

        const canton = await prisma.location.upsert({
          where: { code: cCode(pid, cid) },
          create: {
            name: cName,
            code: cCode(pid, cid),
            type: LocationType.canton,
            parent_id: province.id,
          },
          update: { name: cName, parent_id: province.id },
        });
        totalCantons++;
        console.log(`  [${cCode(pid, cid)}] ${cName}`);

        await sleep(80);
        const districts = await fetchJson<Record<string, string>>(
          `${BASE_URL}/provincia/${pid}/canton/${cid}/distritos.json`,
        );

        for (const [dId, dName] of Object.entries(districts)) {
          const did = parseInt(dId);

          await prisma.location.upsert({
            where: { code: dCode(pid, cid, did) },
            create: {
              name: dName,
              code: dCode(pid, cid, did),
              type: LocationType.district,
              parent_id: canton.id,
            },
            update: { name: dName, parent_id: canton.id },
          });
          totalDistricts++;
        }

        console.log(`    → ${Object.keys(districts).length} distritos`);
        await sleep(80);
      }
    }

    console.log('\n✓ Seed completo');
    console.log(`  Provincias : ${totalProvinces}`);
    console.log(`  Cantones   : ${totalCantons}`);
    console.log(`  Distritos  : ${totalDistricts}`);
    console.log(`  Total      : ${totalProvinces + totalCantons + totalDistricts}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
