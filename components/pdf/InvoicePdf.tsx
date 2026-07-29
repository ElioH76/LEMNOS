import { Document, Page, Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { computeTotals, formatEuro, lineHt } from "@/lib/billing/calc";
import { company, companyAddressLine, companyLegalMentions } from "@/lib/settings/company";
import type { Invoice } from "@/lib/billing/types";

const GREEN = "#1E5B3C";
const INK = "#1A1D1F";
const ASH = "#8A928D";
const LINE = "#E2E4E1";
const PAPER = "#F4F4F2";

// Emblème officiel (public/images/logo/LEMNOS.svg), viewBox 132 30 326 302.
const MARK_VIEWBOX = "132 30 326 302";
const MARK_PATHS = [
  "M349.53,244.86c5.44,13.35,16.65,21.64,30.55,23.43,1.31.17,2.84,1.03,3.93,1.87l-.11,21.15h-72.38s5.63-63.36,5.63-63.36l7.03-75.57,33.54-10.01h94.11c.47,4.17-1.91,7.72-5.36,10.03-20.6,13.75-47.67,24.55-71.48,31.57-7.19,2.12-12.93,4.96-17.83,10.88-11.44,13.79-14.6,32.9-7.63,50.01Z",
  "M205.5,272.19c-.01-1.9,1.2-3.52,2.95-3.7,13.96-1.48,25.44-9.75,31.16-22.65,7.21-16.27,4.83-35.28-5.87-49.34-5.03-6.62-11.06-10.29-19.01-12.59-24.64-7.14-48.07-16.9-69.86-30.25-4.08-2.67-7.38-5.61-7.27-11.27h94.8s33.16,10.04,33.16,10.04l12.43,138.89h-72.31s-.16-19.12-.16-19.12Z",
  "M309.87,164.02c-3.58,54.43-6.7,108.48-14.92,162.27-1.22-3.51-1.79-6.34-2.22-9.91-4.07-34.18-7.6-67.81-9.95-102.3l-4.2-70.23-34.35-9.56,36.06-9.31,3.62-73.37c.4-8.07-9.5-1.05-9.87-9.51-.13-2.87,1.85-5.97,5.45-5.97l30.73-.02c3.6,0,5.85,2.87,5.67,6-.44,7.62-9.49,2.74-9.78,8.11l3.6,74.81,35.77,9.2-34.29,9.62-1.32,20.15Z",
];

const s = StyleSheet.create({
  page: { paddingHorizontal: 42, paddingVertical: 40, fontSize: 9, color: INK, fontFamily: "Helvetica" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  brandRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  markBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: GREEN, alignItems: "center", justifyContent: "center" },
  brandName: { fontSize: 20, fontFamily: "Helvetica-Bold", letterSpacing: 3 },
  tagline: { fontSize: 8, color: ASH, marginTop: 2, letterSpacing: 0.5 },
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
  payBlock: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: GREEN, borderRadius: 4, paddingVertical: 8, paddingHorizontal: 9, marginTop: 6 },
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

  return (
    <Document title={`Facture ${invoice.number}`} author="LEMNOS">
      <Page size="A4" style={s.page}>
        {/* En-tête */}
        <View style={s.header}>
          <View style={s.brandRow}>
            <View style={s.markBox}>
              <Svg width={24} height={22} viewBox={MARK_VIEWBOX}>
                {MARK_PATHS.map((d, i) => (
                  <Path key={i} d={d} fill="#fff" />
                ))}
              </Svg>
            </View>
            <View>
              <Text style={s.brandName}>LEMNOS</Text>
              <Text style={s.tagline}>Forger vos idées</Text>
            </View>
          </View>
          <View>
            <Text style={s.docTitle}>FACTURE</Text>
            <Text style={s.number}>{invoice.number}</Text>
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
        {invoice.projectRef ? (
          <Text style={{ marginTop: 8, fontSize: 9.5 }}>
            <Text style={{ fontFamily: "Helvetica-Bold" }}>Projet : </Text>
            {invoice.projectRef}
          </Text>
        ) : null}

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
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11 }}>{formatEuro(t.totalTtc)}</Text>
            </View>
            {t.deposit > 0 ? (
              <View style={s.totalRow}>
                <Text style={{ color: ASH }}>Acompte payé</Text>
                <Text style={{ color: ASH }}>- {formatEuro(t.deposit)}</Text>
              </View>
            ) : null}
            <View style={s.payBlock}>
              <Text style={{ fontFamily: "Helvetica-Bold", color: "#fff", fontSize: 10 }}>
                TOTAL À PAYER
              </Text>
              <Text style={{ fontFamily: "Helvetica-Bold", color: "#fff", fontSize: 15 }}>
                {formatEuro(t.remaining)}
              </Text>
            </View>
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

        {/* Mentions légales — adaptées au statut fiscal */}
        <Text style={s.footer} fixed>
          {companyLegalMentions()}
        </Text>
      </Page>
    </Document>
  );
}
