import { Document, Page, Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { computeTotals, formatEuro, lineHt } from "@/lib/billing/calc";
import { company, companyAddressLine } from "@/lib/settings/company";
import { INVOICE_STATUS_LABEL, type Invoice } from "@/lib/billing/types";

const GREEN = "#1E5B3C";
const INK = "#1A1D1F";
const ASH = "#8A928D";
const LINE = "#E2E4E1";
const PAPER = "#F4F4F2";

const MARK_PATHS = [
  "M 1389.02 730.197 C 1415.18 729.177 1448.8 730.07 1475.36 730.076 L 1643.02 730.102 L 1821.27 730.024 C 1857.66 729.968 1897.32 729.264 1933.44 730.467 L 1933.42 731.235 C 1932.35 761.835 1918 776.426 1893.64 792.682 C 1880.6 801.393 1868.54 809.026 1854.85 816.903 C 1771.53 864.383 1684.1 904.263 1593.62 936.06 C 1562.43 947.049 1531.01 957.405 1499.4 967.122 C 1458.97 979.946 1433.61 985.054 1401.82 1015.84 C 1298.39 1116 1290.14 1291.52 1389.3 1397.07 C 1409.13 1416.93 1432.75 1432.62 1458.75 1443.19 C 1471.44 1448.4 1484.61 1452.35 1498.07 1454.99 C 1507.62 1456.83 1539.43 1459.7 1539.3 1471.48 C 1538.9 1509.22 1542.29 1553.71 1539.31 1590.91 C 1529.17 1591.98 1503.98 1591.32 1493.16 1591.32 L 1401.42 1591.26 L 1121.16 1591.36 C 1145.36 1324.05 1167.24 1054.88 1194.39 787.951 L 1321.59 749.781 C 1338.34 744.714 1372.72 733.253 1389.02 730.197 z",
  "M 115.549 730.261 C 156.488 728.945 202.226 730.016 243.71 730.046 L 478.42 730.056 L 601.13 729.973 C 614.304 729.964 652.742 729.031 663.925 731.027 C 675.951 733.175 707.485 743.621 720.683 747.558 C 765.691 760.936 810.618 774.582 855.463 788.496 C 856.715 812.334 859.687 839.616 861.867 863.62 L 874.395 998.696 L 909.93 1404.03 C 915.126 1465.01 923.102 1530.46 926.472 1591.22 C 902.326 1591.85 876.124 1591.31 851.752 1591.31 L 706.5 1591.21 C 642.687 1591.25 571.877 1592.82 508.761 1591.12 L 508.681 1589.77 C 507.847 1574.66 507.033 1474.11 510.37 1468.17 C 512.362 1464.62 518.838 1462.16 522.44 1460.93 C 530.045 1458.34 538.672 1457.53 546.553 1455.9 C 563.249 1452.46 580.173 1447.85 595.727 1440.76 C 622.511 1428.63 646.446 1411.01 665.981 1389.03 C 765.001 1278.93 744.885 1085.17 625.06 997.984 C 595.894 976.762 526.142 959.803 488.861 947.257 C 389.207 914.444 292.93 872.15 201.351 820.956 C 186.883 812.79 173.243 804.576 159.305 795.655 C 130.967 777.518 117.104 764.787 115.549 730.261 z",
  "M 934.949 115.312 C 935.905 115.272 936.862 115.239 937.819 115.212 C 976.607 114.33 1016.97 115.707 1056.01 115.132 C 1076.11 114.836 1100.08 114.653 1120.16 115.982 C 1126.44 116.398 1132.49 120.895 1136.91 124.842 C 1143.67 131.087 1146.49 143.64 1146.38 152.167 C 1146.23 163.577 1139 170.681 1129.12 175.137 C 1118.17 180.077 1103.32 177.042 1093.91 185.668 C 1091.43 187.944 1089.84 193.055 1089.89 196.336 C 1090.15 213.15 1090.91 229.972 1091.69 246.767 L 1096.86 348.971 L 1109.99 629.978 L 1319.34 683.175 C 1302.17 688.749 1279.73 694.21 1262 699.13 L 1118.29 738.518 C 1102.58 1065.81 1075.56 1392.46 1037.27 1717.89 C 1033.46 1744.98 1029.83 1774.4 1024.24 1801 C 1022.4 1793.72 1020.76 1785.93 1019.51 1778.51 C 1006.53 1701.67 999.748 1623.43 991.096 1546.08 C 970.036 1355.41 954.554 1164.17 944.667 972.606 L 936.367 831.746 C 934.473 801.233 931.813 768.541 930.819 738.121 L 729.537 683.374 C 762.003 674.512 797.216 666.284 830.011 658.06 L 940.466 630.09 C 942.369 606.065 943.041 577.996 944.279 553.664 L 952.305 393.408 C 953.742 364.173 964.06 204.944 960.156 191.826 C 954.789 173.79 928.431 181.035 915.223 172.726 C 909.668 169.232 906.605 164.19 905.38 157.807 C 903.448 147.738 904.783 136.595 910.863 128.142 C 916.934 119.702 925.111 116.745 934.949 115.312 z",
];

const s = StyleSheet.create({
  page: { paddingHorizontal: 42, paddingVertical: 40, fontSize: 9, color: INK, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  markBox: { width: 30, height: 30, borderRadius: 6, backgroundColor: GREEN, alignItems: "center", justifyContent: "center" },
  brandName: { fontSize: 15, fontFamily: "Helvetica-Bold", letterSpacing: 2 },
  tagline: { fontSize: 7.5, color: ASH, marginTop: 1 },
  docTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", color: GREEN, textAlign: "right" },
  number: { fontSize: 11, fontFamily: "Helvetica-Bold", textAlign: "right", marginTop: 2 },
  metaRight: { fontSize: 8, color: ASH, textAlign: "right", marginTop: 2 },
  rule: { height: 2, backgroundColor: INK, marginTop: 14, marginBottom: 16 },
  cols: { flexDirection: "row", gap: 24 },
  col: { flex: 1 },
  blockLabel: { fontSize: 7.5, color: ASH, fontFamily: "Helvetica-Bold", letterSpacing: 1, marginBottom: 3, textTransform: "uppercase" },
  strong: { fontFamily: "Helvetica-Bold", fontSize: 10, marginBottom: 1 },
  line: { marginBottom: 1 },
  datesRow: { flexDirection: "row", gap: 20, backgroundColor: PAPER, padding: 8, borderRadius: 4, marginTop: 14 },
  th: { flexDirection: "row", backgroundColor: GREEN, color: "#fff", paddingVertical: 6, paddingHorizontal: 6, fontFamily: "Helvetica-Bold", fontSize: 8 },
  tr: { flexDirection: "row", paddingVertical: 6, paddingHorizontal: 6, borderBottomWidth: 0.5, borderBottomColor: LINE },
  cDesc: { flex: 1, paddingRight: 6 },
  cNum: { width: 42, textAlign: "right" },
  cRate: { width: 40, textAlign: "right" },
  cTotal: { width: 62, textAlign: "right" },
  totals: { marginTop: 14, flexDirection: "row", justifyContent: "flex-end" },
  totalsBox: { width: 220 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  totalTtc: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: INK, paddingTop: 4, marginTop: 3 },
  remaining: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#E7EFE9", padding: 5, borderRadius: 3, marginTop: 4 },
  section: { marginTop: 18, borderTopWidth: 0.5, borderTopColor: LINE, paddingTop: 12 },
  small: { fontSize: 8.5, color: "#5A5148", marginBottom: 3, lineHeight: 1.5 },
  footer: { position: "absolute", bottom: 28, left: 42, right: 42, borderTopWidth: 0.5, borderTopColor: LINE, paddingTop: 8, fontSize: 7.5, color: ASH, textAlign: "center", lineHeight: 1.5 },
});

function frDate(iso: string): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(iso));
}

export function InvoicePdf({ invoice }: { invoice: Invoice }) {
  const t = computeTotals(invoice);
  const c = company;
  const mentions = [
    `${c.name} — ${companyAddressLine()}`,
    c.siren && `SIREN ${c.siren}`,
    c.siret && `SIRET ${c.siret}`,
    c.rcs && `RCS ${c.rcs}`,
    c.tvaIntra && `TVA ${c.tvaIntra}`,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Document title={`Facture ${invoice.number}`} author="LEMNOS">
      <Page size="A4" style={s.page}>
        {/* En-tête */}
        <View style={s.header}>
          <View style={s.brandRow}>
            <View style={s.markBox}>
              <Svg width={17} height={16} viewBox="0 0 2048 1905">
                {MARK_PATHS.map((d, i) => (
                  <Path key={i} d={d} fill="#fff" />
                ))}
              </Svg>
            </View>
            <View>
              <Text style={s.brandName}>LEMNOS</Text>
              <Text style={s.tagline}>Vêtements de sport personnalisés</Text>
            </View>
          </View>
          <View>
            <Text style={s.docTitle}>FACTURE</Text>
            <Text style={s.number}>{invoice.number}</Text>
            <Text style={s.metaRight}>Statut : {INVOICE_STATUS_LABEL[invoice.status]}</Text>
          </View>
        </View>

        <View style={s.rule} />

        {/* Émetteur / Client */}
        <View style={s.cols}>
          <View style={s.col}>
            <Text style={s.blockLabel}>Émetteur</Text>
            <Text style={s.strong}>{c.name}</Text>
            <Text style={s.line}>{companyAddressLine()}</Text>
            <Text style={s.line}>{c.email}</Text>
            <Text style={s.line}>{c.phone}</Text>
          </View>
          <View style={s.col}>
            <Text style={s.blockLabel}>Facturé à</Text>
            <Text style={s.strong}>{invoice.client.club}</Text>
            {invoice.client.contact ? <Text style={s.line}>{invoice.client.contact}</Text> : null}
            {invoice.client.address ? <Text style={s.line}>{invoice.client.address}</Text> : null}
            <Text style={s.line}>
              {[invoice.client.zip, invoice.client.city].filter(Boolean).join(" ")}
              {invoice.client.country ? `, ${invoice.client.country}` : ""}
            </Text>
            {invoice.client.email ? <Text style={s.line}>{invoice.client.email}</Text> : null}
            {invoice.client.phone ? <Text style={s.line}>{invoice.client.phone}</Text> : null}
          </View>
        </View>

        {/* Dates */}
        <View style={s.datesRow}>
          <Text>Date : {frDate(invoice.date)}</Text>
          <Text>Échéance : {frDate(invoice.dueDate)}</Text>
          {invoice.internalRef ? <Text>Réf. : {invoice.internalRef}</Text> : null}
        </View>

        {/* Table */}
        <View style={{ marginTop: 16 }}>
          <View style={s.th}>
            <Text style={s.cDesc}>Désignation</Text>
            <Text style={s.cNum}>Qté</Text>
            <Text style={s.cNum}>PU HT</Text>
            <Text style={s.cRate}>TVA</Text>
            <Text style={s.cTotal}>Total HT</Text>
          </View>
          {invoice.lines.map((l) => (
            <View style={s.tr} key={l.id}>
              <Text style={s.cDesc}>
                {l.label}
                {l.discountValue > 0
                  ? `  (remise ${l.discountType === "percent" ? `${l.discountValue}%` : formatEuro(l.discountValue)})`
                  : ""}
              </Text>
              <Text style={s.cNum}>{l.quantity}</Text>
              <Text style={s.cNum}>{formatEuro(l.unitPriceHt)}</Text>
              <Text style={s.cRate}>{l.vatRate}%</Text>
              <Text style={s.cTotal}>{formatEuro(lineHt(l))}</Text>
            </View>
          ))}
        </View>

        {/* Totaux */}
        <View style={s.totals}>
          <View style={s.totalsBox}>
            <View style={s.totalRow}>
              <Text>Total HT</Text>
              <Text>{formatEuro(t.linesHt)}</Text>
            </View>
            {t.globalDiscount > 0 ? (
              <View style={s.totalRow}>
                <Text>Remise globale</Text>
                <Text>- {formatEuro(t.globalDiscount)}</Text>
              </View>
            ) : null}
            {t.shipping > 0 ? (
              <View style={s.totalRow}>
                <Text>Frais de livraison</Text>
                <Text>{formatEuro(t.shipping)}</Text>
              </View>
            ) : null}
            {Object.entries(t.vatByRate).map(([rate, amount]) => (
              <View style={s.totalRow} key={rate}>
                <Text style={{ color: ASH }}>TVA {rate}%</Text>
                <Text style={{ color: ASH }}>{formatEuro(amount)}</Text>
              </View>
            ))}
            <View style={s.totalTtc}>
              <Text style={{ fontFamily: "Helvetica-Bold" }}>Total TTC</Text>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 12 }}>{formatEuro(t.totalTtc)}</Text>
            </View>
            {t.deposit > 0 ? (
              <>
                <View style={s.totalRow}>
                  <Text style={{ color: ASH }}>Acompte payé</Text>
                  <Text style={{ color: ASH }}>- {formatEuro(t.deposit)}</Text>
                </View>
                <View style={s.remaining}>
                  <Text style={{ fontFamily: "Helvetica-Bold", color: GREEN }}>Reste à payer</Text>
                  <Text style={{ fontFamily: "Helvetica-Bold", color: GREEN }}>{formatEuro(t.remaining)}</Text>
                </View>
              </>
            ) : null}
          </View>
        </View>

        {/* Paiement / notes */}
        {invoice.paymentTerms || c.iban || c.bic || invoice.notes ? (
          <View style={s.section}>
            {invoice.paymentTerms ? (
              <Text style={s.small}>
                <Text style={{ fontFamily: "Helvetica-Bold", color: INK }}>Conditions de paiement : </Text>
                {invoice.paymentTerms}
              </Text>
            ) : null}
            {c.iban || c.bic ? (
              <Text style={s.small}>
                <Text style={{ fontFamily: "Helvetica-Bold", color: INK }}>Coordonnées bancaires : </Text>
                {[c.iban && `IBAN ${c.iban}`, c.bic && `BIC ${c.bic}`].filter(Boolean).join("  ·  ")}
              </Text>
            ) : null}
            {invoice.notes ? <Text style={s.small}>{invoice.notes}</Text> : null}
          </View>
        ) : null}

        {/* Mentions légales */}
        <Text style={s.footer} fixed>
          {mentions}
        </Text>
      </Page>
    </Document>
  );
}
