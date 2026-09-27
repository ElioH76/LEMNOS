import { Document, Image, Page, Path, StyleSheet, Svg, Text, View } from "@react-pdf/renderer";
import { amountInWords, documentAmounts, formatDiscount, formatEuro, lineGross, lineHt } from "@/lib/billing/calc";
import {
  PAYMENT_METHOD_LABEL,
  documentTitle,
  type BankSnapshot,
  type CommercialDocument,
  type SellerSnapshot,
  type TermsSnapshot,
} from "@/lib/billing/types";

/**
 * PDF A4 des documents commerciaux — direction artistique de la facture
 * LEMNOS : bandeau vert, emblème, Cinzel + Montserrat, grands blancs, bloc
 * « net à payer » vert. Devis, facture, facture d'acompte et avoir partagent
 * exactement la même mise en page ; seuls le titre et les blocs propres à la
 * nature du document changent.
 *
 * Les polices sont enregistrées par lib/pdf/render.ts (seul point d'entrée).
 */

const MARK_VIEWBOX = "132 30 326 302";
const MARK_PATHS = [
  "M349.53,244.86c5.44,13.35,16.65,21.64,30.55,23.43,1.31.17,2.84,1.03,3.93,1.87l-.11,21.15h-72.38s5.63-63.36,5.63-63.36l7.03-75.57,33.54-10.01h94.11c.47,4.17-1.91,7.72-5.36,10.03-20.6,13.75-47.67,24.55-71.48,31.57-7.19,2.12-12.93,4.96-17.83,10.88-11.44,13.79-14.6,32.9-7.63,50.01Z",
  "M205.5,272.19c-.01-1.9,1.2-3.52,2.95-3.7,13.96-1.48,25.44-9.75,31.16-22.65,7.21-16.27,4.83-35.28-5.87-49.34-5.03-6.62-11.06-10.29-19.01-12.59-24.64-7.14-48.07-16.9-69.86-30.25-4.08-2.67-7.38-5.61-7.27-11.27h94.8s33.16,10.04,33.16,10.04l12.43,138.89h-72.31s-.16-19.12-.16-19.12Z",
  "M309.87,164.02c-3.58,54.43-6.7,108.48-14.92,162.27-1.22-3.51-1.79-6.34-2.22-9.91-4.07-34.18-7.6-67.81-9.95-102.3l-4.2-70.23-34.35-9.56,36.06-9.31,3.62-73.37c.4-8.07-9.5-1.05-9.87-9.51-.13-2.87,1.85-5.97,5.45-5.97l30.73-.02c3.6,0,5.85,2.87,5.67,6-.44,7.62-9.49,2.74-9.78,8.11l3.6,74.81,35.77,9.2-34.29,9.62-1.32,20.15Z",
];

const MM = 2.835;
const INK = "#1A1D1F";
const BODY = "#3C4240";
const ASH = "#7C847F";
const LINE = "#E3E6E3";

export interface PdfContext {
  seller: SellerSnapshot;
  bank: BankSnapshot;
  terms: TermsSnapshot;
  slogan: string;
  /** Logo personnalisé (octets), sinon l'emblème LEMNOS. */
  logo: { data: Buffer; format: "png" | "jpg" } | null;
  /** Numéros des documents liés, pour les références. */
  quoteNumber: string | null;
  originalInvoice: { number: string | null; date: string } | null;
}

function frDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

/** Couleur secondaire douce dérivée de la couleur principale. */
function soften(hex: string, amount = 0.9): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "#EEF3F0";
  const n = parseInt(m[1], 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function makeStyles(green: string) {
  const greenSoft = soften(green, 0.9);
  return StyleSheet.create({
    page: {
      paddingTop: 5 * MM + 10 * MM,
      paddingBottom: 26 * MM,
      paddingHorizontal: 18 * MM,
      fontFamily: "Montserrat",
      fontSize: 8.6,
      color: INK,
      lineHeight: 1.5,
    },
    topbar: { position: "absolute", top: 0, left: 0, right: 0, height: 5 * MM, backgroundColor: green },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
    brand: { flexDirection: "row", alignItems: "center" },
    markBox: {
      width: 17 * MM,
      height: 17 * MM,
      borderRadius: 3 * MM,
      backgroundColor: green,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 4.5 * MM,
    },
    wordmark: { fontFamily: "Cinzel", fontWeight: 700, fontSize: 21, letterSpacing: 5.6, lineHeight: 1 },
    slogan: {
      fontFamily: "Cinzel",
      fontWeight: 500,
      fontSize: 7.4,
      letterSpacing: 1.6,
      color: green,
      marginTop: 5,
      textTransform: "uppercase",
    },
    docBox: { alignItems: "flex-end", maxWidth: 95 * MM },
    title: { fontWeight: 300, color: green, lineHeight: 1, textAlign: "right" },
    number: { fontWeight: 600, fontSize: 10.2, marginTop: 7, letterSpacing: 0.4 },
    draft: {
      marginTop: 4,
      fontSize: 6.8,
      fontWeight: 600,
      letterSpacing: 1.2,
      color: "#9A5A12",
      backgroundColor: "#FFF4E3",
      paddingVertical: 1.5,
      paddingHorizontal: 5,
      borderRadius: 2,
    },
    label: {
      fontSize: 6.3,
      fontWeight: 600,
      letterSpacing: 1.1,
      textTransform: "uppercase",
      color: ASH,
      marginBottom: 4.5,
    },
    parties: { flexDirection: "row", marginTop: 8 * MM },
    party: { flex: 1 },
    partyClient: { flex: 1, marginLeft: 12 * MM, borderLeftWidth: 1.7, borderLeftColor: green, paddingLeft: 5 * MM },
    name: { fontWeight: 700, fontSize: 10.2, marginBottom: 2 },
    body: { color: BODY },
    meta: {
      flexDirection: "row",
      marginTop: 6.5 * MM,
      backgroundColor: greenSoft,
      borderRadius: 2 * MM,
      paddingVertical: 4.2 * MM,
      paddingHorizontal: 5 * MM,
    },
    metaCell: { flex: 1 },
    metaCellSep: { flex: 1, borderLeftWidth: 0.7, borderLeftColor: soften(green, 0.72), paddingLeft: 4.5 * MM },
    metaValue: { fontWeight: 600, fontSize: 8.8 },
    object: { flexDirection: "row", alignItems: "baseline", marginTop: 6 * MM },
    objectText: { fontWeight: 600, fontSize: 9, flex: 1 },
    tableHead: {
      flexDirection: "row",
      marginTop: 4 * MM,
      paddingBottom: 6,
      borderBottomWidth: 1.4,
      borderBottomColor: green,
    },
    th: { fontSize: 6.3, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: green },
    row: { flexDirection: "row", paddingVertical: 3.2 * MM, borderBottomWidth: 0.7, borderBottomColor: LINE },
    cDesc: { flex: 1, paddingRight: 8 },
    cQty: { width: 16 * MM, textAlign: "right" },
    cPu: { width: 28 * MM, textAlign: "right" },
    cTot: { width: 28 * MM, textAlign: "right" },
    lineTitle: { fontWeight: 600, fontSize: 9 },
    lineDesc: { color: ASH, fontSize: 7.5, marginTop: 1.5, lineHeight: 1.45 },
    num: { fontSize: 8.8 },
    notes: { marginTop: 4 * MM, color: BODY, fontSize: 8 },
    bottom: { flexDirection: "row", marginTop: 6 * MM, alignItems: "flex-start" },
    words: { flex: 1, paddingRight: 10 * MM, color: BODY, fontSize: 8 },
    totals: { width: 88 * MM },
    tRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 3.1 },
    tRowSep: { borderBottomWidth: 0.7, borderBottomColor: LINE },
    grand: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 3 * MM,
      backgroundColor: green,
      borderRadius: 2 * MM,
      paddingVertical: 3.4 * MM,
      paddingHorizontal: 5 * MM,
    },
    grandLabel: { color: "#FFFFFF", fontSize: 6.8, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", lineHeight: 1 },
    grandValue: { color: "#FFFFFF", fontSize: 15, fontWeight: 700, lineHeight: 1 },
    vat: { marginTop: 2.5 * MM, fontSize: 7.5, fontWeight: 600, textAlign: "right" },
    after: { marginTop: 2 * MM, fontSize: 7.5, color: ASH, textAlign: "right" },
    section: {
      flexDirection: "row",
      marginTop: 5.5 * MM,
      paddingTop: 4.5 * MM,
      borderTopWidth: 0.7,
      borderTopColor: LINE,
    },
    col: { flex: 1 },
    colRight: { flex: 1, marginLeft: 12 * MM },
    small: { color: BODY, fontSize: 8 },
    bankRow: { flexDirection: "row", marginBottom: 1.5 },
    bankKey: { width: 17 * MM, color: ASH, fontSize: 8 },
    bankVal: { flex: 1, fontSize: 8, fontWeight: 500 },
    signBox: {
      marginTop: 2,
      minHeight: 17 * MM,
      borderWidth: 0.8,
      borderColor: LINE,
      borderStyle: "dashed",
      borderRadius: 2,
      padding: 6,
    },
    terms: { marginTop: 4 * MM, fontSize: 6.5, color: ASH, lineHeight: 1.55 },
    footer: {
      position: "absolute",
      left: 18 * MM,
      right: 18 * MM,
      bottom: 9 * MM,
      borderTopWidth: 0.7,
      borderTopColor: LINE,
      paddingTop: 3.5 * MM,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      fontSize: 6.4,
      color: ASH,
    },
    forge: { fontFamily: "Cinzel", fontWeight: 500, letterSpacing: 1.3, color: green, fontSize: 6.8, marginLeft: 6 * MM },
  });
}

type Styles = ReturnType<typeof makeStyles>;

function TotalRow({ s, label, value, color, bold, sep }: { s: Styles; label: string; value: string; color?: string; bold?: boolean; sep?: boolean }) {
  const style = { color, fontWeight: bold ? 600 : undefined };
  return (
    <View style={sep ? [s.tRow, s.tRowSep] : s.tRow}>
      <Text style={[style, { flex: 1, paddingRight: 8 }]}>{label}</Text>
      <Text style={[style, { textAlign: "right" }]}>{value}</Text>
    </View>
  );
}

export function DocumentPdf({ doc, ctx }: { doc: CommercialDocument; ctx: PdfContext }) {
  const green = /^#[0-9a-f]{6}$/i.test(ctx.seller.primaryColor) ? ctx.seller.primaryColor : "#1E5B3C";
  const s = makeStyles(green);
  const a = documentAmounts(doc);
  const title = documentTitle(doc).toUpperCase();
  const isQuote = doc.type === "devis";
  const isCredit = doc.type === "avoir";
  const isDeposit = doc.type === "facture" && doc.kind === "acompte";
  const isInvoice = doc.type === "facture";
  const seller = ctx.seller;
  const terms = ctx.terms;
  const vatExempt = doc.vatExempt;

  const titleSize = title.length > 12 ? 17 : 25;
  const titleSpacing = title.length > 12 ? 3.2 : 7;

  // Cellules de la bande de dates, selon la nature du document.
  const meta: [string, string][] = [];
  if (isQuote) {
    meta.push(["Date du devis", frDate(doc.date)], ["Valable jusqu'au", frDate(doc.validUntil)]);
    meta.push(["Livraison prévue", doc.plannedDeliveryDate ? frDate(doc.plannedDeliveryDate) : doc.deliveryLeadTime || "À définir"]);
    meta.push(["Acompte", a.deposit > 0 ? formatEuro(a.deposit) : "Aucun"]);
  } else if (isCredit) {
    meta.push(["Date de l'avoir", frDate(doc.date)]);
    meta.push(["Facture concernée", ctx.originalInvoice?.number ?? "—"]);
    meta.push(["Date de la facture", frDate(ctx.originalInvoice?.date)]);
  } else {
    meta.push([isDeposit ? "Date de facture" : "Date de facture", frDate(doc.date)]);
    meta.push(["Échéance", doc.dueDate && doc.dueDate === doc.date ? "À réception" : frDate(doc.dueDate)]);
    if (!isDeposit) meta.push(["Date de livraison", doc.deliveryDate ? frDate(doc.deliveryDate) : "—"]);
    meta.push(ctx.quoteNumber ? ["Devis de référence", ctx.quoteNumber] : ["Opération", "Livraison de biens"]);
  }

  const clientLabel = isQuote ? "Client" : isCredit ? "Avoir au bénéfice de" : "Facturé à";
  const c = doc.client;
  const cityLine = [c.zip, c.city].filter(Boolean).join(" ") + (c.country && c.country !== "France" ? `, ${c.country}` : "");
  const legalIds = [
    c.siret ? `SIRET : ${c.siret}` : c.siren ? `SIREN : ${c.siren}` : "",
    c.rna ? `RNA : ${c.rna}` : "",
  ].filter(Boolean);

  const sellerLines = [
    [seller.manager, seller.legalStatus].filter(Boolean).join(" — "),
    seller.address && `${seller.address}, ${[seller.zip, seller.city].filter(Boolean).join(" ")}${seller.country ? `, ${seller.country}` : ""}`,
    seller.siret && `SIRET : ${seller.siret}`,
    !vatExempt && seller.tvaIntra ? `TVA intracommunautaire : ${seller.tvaIntra}` : "",
    seller.email,
    seller.phone && `Tél. : ${seller.phone}`,
  ].filter(Boolean) as string[];

  const bankRows = (
    [
      ["Titulaire", ctx.bank.holder],
      ["Banque", ctx.bank.bank],
      ["IBAN", ctx.bank.iban],
      ["BIC", ctx.bank.bic],
    ] as [string, string][]
  ).filter(([, v]) => v);

  const legalFooter = [
    seller.name,
    [seller.manager, seller.legalStatus.includes("EI") ? "EI" : seller.legalStatus].filter(Boolean).join(", "),
    [seller.address, [seller.zip, seller.city].filter(Boolean).join(" ")].filter(Boolean).join(", "),
    seller.siret && `SIRET ${seller.siret}`,
    vatExempt ? terms.vatMention : seller.tvaIntra && `TVA ${seller.tvaIntra}`,
  ]
    .filter(Boolean)
    .join(" · ");

  const legalText = [
    terms.earlyPaymentText,
    terms.latePenaltyText,
    terms.recoveryIndemnityText,
    terms.retentionOfTitleText,
    terms.generalConditions,
  ]
    .filter(Boolean)
    .join(" ");

  const grandLabel = isQuote ? "Total" : isCredit ? "Montant de l'avoir" : isDeposit ? "Acompte à payer" : "Net à payer";
  const showSubtotal = a.globalDiscount > 0 || a.shipping > 0 || !vatExempt;

  return (
    <Document
      title={`${documentTitle(doc)} ${doc.number ?? "brouillon"} — ${seller.name}`}
      author={seller.name}
      creator={seller.name}
      producer={seller.name}
    >
      <Page size="A4" style={s.page}>
        <View style={s.topbar} fixed />

        {/* En-tête */}
        <View style={s.header}>
          <View style={s.brand}>
            {ctx.logo ? (
              <Image src={ctx.logo} style={{ width: 17 * MM, height: 17 * MM, objectFit: "contain", marginRight: 4.5 * MM }} />
            ) : (
              <View style={s.markBox}>
                <Svg width={10.5 * MM} height={10 * MM} viewBox={MARK_VIEWBOX}>
                  {MARK_PATHS.map((d, i) => (
                    <Path key={i} d={d} fill="#FFFFFF" />
                  ))}
                </Svg>
              </View>
            )}
            <View>
              <Text style={s.wordmark}>{(seller.tradeName || seller.name).toUpperCase()}</Text>
              {ctx.slogan ? <Text style={s.slogan}>{ctx.slogan}</Text> : null}
            </View>
          </View>
          <View style={s.docBox}>
            <Text style={[s.title, { fontSize: titleSize, letterSpacing: titleSpacing }]}>{title}</Text>
            <Text style={s.number}>{doc.number ? `N° ${doc.number}` : "Non numéroté"}</Text>
            {!doc.number || (isQuote && doc.quoteStatus === "brouillon") ? (
              <Text style={s.draft}>BROUILLON — DOCUMENT NON ÉMIS</Text>
            ) : null}
          </View>
        </View>

        {/* Émetteur / client */}
        <View style={s.parties}>
          <View style={s.party}>
            <Text style={s.label}>Émetteur</Text>
            <Text style={s.name}>{seller.name}</Text>
            {sellerLines.map((l, i) => (
              <Text key={i} style={s.body}>
                {l}
              </Text>
            ))}
          </View>
          <View style={s.partyClient}>
            <Text style={s.label}>{clientLabel}</Text>
            <Text style={s.name}>{c.club}</Text>
            {c.contact ? (
              <Text style={s.body}>
                {c.contact}
                {c.contactRole ? ` — ${c.contactRole}` : ""}
              </Text>
            ) : null}
            {c.address ? <Text style={s.body}>{c.address}</Text> : null}
            {cityLine.trim() ? <Text style={s.body}>{cityLine}</Text> : null}
            {legalIds.map((l) => (
              <Text key={l} style={s.body}>
                {l}
              </Text>
            ))}
            {c.email ? <Text style={s.body}>{c.email}</Text> : null}
          </View>
        </View>

        {/* Dates */}
        <View style={s.meta} wrap={false}>
          {meta.map(([k, v], i) => (
            <View key={k} style={i === 0 ? s.metaCell : s.metaCellSep}>
              <Text style={s.label}>{k}</Text>
              <Text style={s.metaValue}>{v}</Text>
            </View>
          ))}
        </View>

        {doc.subject ? (
          <View style={s.object}>
            <Text style={[s.label, { marginBottom: 0, marginRight: 8 }]}>Objet</Text>
            <Text style={s.objectText}>{doc.subject}</Text>
          </View>
        ) : null}

        {isCredit && doc.reason ? (
          <View style={s.object}>
            <Text style={[s.label, { marginBottom: 0, marginRight: 8 }]}>Motif</Text>
            <Text style={[s.objectText, { fontWeight: 500 }]}>{doc.reason}</Text>
          </View>
        ) : null}

        {/* Lignes */}
        {isDeposit ? <Text style={[s.label, { marginTop: 5 * MM, marginBottom: 0 }]}>Rappel de la commande</Text> : null}
        <View style={s.tableHead} fixed={false}>
          <Text style={[s.th, s.cDesc]}>Désignation</Text>
          <Text style={[s.th, s.cQty]}>Qté</Text>
          <Text style={[s.th, s.cPu]}>Prix unitaire</Text>
          <Text style={[s.th, s.cTot]}>Montant</Text>
        </View>
        {doc.lines.map((l) => {
          const discounted = l.discountValue > 0;
          return (
            <View key={l.id} style={s.row} wrap={false}>
              <View style={s.cDesc}>
                <Text style={s.lineTitle}>{l.label}</Text>
                {l.description ? <Text style={s.lineDesc}>{l.description}</Text> : null}
                {discounted ? (
                  <Text style={[s.lineDesc, { color: green }]}>
                    Remise {formatDiscount(l.discountType, l.discountValue)} (−{formatEuro(lineGross(l) - lineHt(l))})
                  </Text>
                ) : null}
                {!vatExempt && l.vatRate > 0 ? <Text style={s.lineDesc}>TVA {l.vatRate} %</Text> : null}
              </View>
              <Text style={[s.num, s.cQty]}>{l.quantity}</Text>
              <Text style={[s.num, s.cPu]}>{formatEuro(l.unitPriceHt)}</Text>
              <Text style={[s.num, s.cTot]}>{formatEuro(lineHt(l))}</Text>
            </View>
          );
        })}

        {doc.notes ? <Text style={s.notes}>{doc.notes}</Text> : null}

        {/* Totaux */}
        <View style={s.bottom} wrap={false}>
          <View style={s.words}>
            <Text style={s.label}>{isCredit ? "Avoir d'un montant de" : "Montant arrêté à la somme de"}</Text>
            <Text>
              <Text style={{ fontWeight: 600, color: INK }}>{amountInWords(a.amountDue)}</Text>
              {vatExempt ? "" : " toutes taxes comprises"}.
            </Text>
            {isQuote && doc.deliveryLeadTime && doc.plannedDeliveryDate ? (
              <Text style={{ marginTop: 6 }}>Délai de livraison prévisionnel : {doc.deliveryLeadTime}</Text>
            ) : null}
            {isInvoice ? (
              <View style={{ marginTop: 5 * MM }}>
                <Text style={s.label}>Conditions de paiement</Text>
                {doc.paymentTerms ? <Text style={s.small}>{doc.paymentTerms}</Text> : null}
                <Text style={s.small}>Mode de règlement : {PAYMENT_METHOD_LABEL[doc.paymentMethod]}</Text>
                {doc.number ? (
                  <Text style={s.small}>
                    Référence à rappeler : <Text style={{ fontWeight: 600, color: INK }}>{doc.number}</Text>
                  </Text>
                ) : null}
              </View>
            ) : null}
            {isQuote ? (
              <View style={{ marginTop: 5 * MM }}>
                <Text style={s.label}>Bon pour accord</Text>
                {doc.acceptance ? (
                  <View style={s.signBox}>
                    <Text style={[s.small, { fontWeight: 600, color: INK }]}>
                      Accepté le {frDate(doc.acceptance.date || doc.acceptance.at)} par {doc.acceptance.name}
                      {doc.acceptance.role ? `, ${doc.acceptance.role}` : ""}
                    </Text>
                    <Text style={[s.small, { color: ASH }]}>
                      {doc.acceptance.method === "admin"
                        ? "Acceptation enregistrée par LEMNOS."
                        : doc.acceptance.method === "en_ligne_signature"
                          ? "Acceptation en ligne avec signature manuscrite dessinée."
                          : "Acceptation en ligne (mention « Bon pour accord »)."}
                    </Text>
                    {doc.acceptance.signature ? (
                      <Image src={doc.acceptance.signature} style={{ height: 11 * MM, objectFit: "contain", marginTop: 2 }} />
                    ) : null}
                  </View>
                ) : (
                  <View style={s.signBox}>
                    <Text style={[s.small, { color: ASH, fontSize: 7 }]}>
                      Date, nom, fonction et signature, précédés de la mention « Bon pour accord »
                    </Text>
                  </View>
                )}
                </View>
            ) : null}
          </View>
          <View style={s.totals}>
            {showSubtotal ? <TotalRow s={s} label="Sous-total" value={formatEuro(a.subtotal)} sep /> : null}
            {a.globalDiscount > 0 ? (
              <TotalRow
                s={s}
                label={`${doc.globalDiscountLabel || "Remise"}${doc.globalDiscountType === "percent" ? ` (−${formatDiscount("percent", doc.globalDiscountValue)})` : ""}`}
                value={`−${formatEuro(a.globalDiscount)}`}
                color={green}
              />
            ) : null}
            {a.shipping > 0 ? <TotalRow s={s} label="Frais de livraison" value={formatEuro(a.shipping)} /> : null}
            {!vatExempt ? (
              <>
                <TotalRow s={s} label="Total HT" value={formatEuro(a.totalHt)} />
                {Object.entries(a.vatByRate).map(([rate, v]) => (
                  <TotalRow key={rate} s={s} label={`TVA ${rate} %`} value={formatEuro(v)} color={ASH} />
                ))}
              </>
            ) : null}

            {isDeposit || doc.deductions.length > 0 ? (
              <TotalRow s={s} label={vatExempt ? "Total de la commande" : "Total TTC de la commande"} value={formatEuro(a.totalTtc)} bold sep />
            ) : null}
            {isDeposit ? (
              <TotalRow
                s={s}
                label={`Acompte${a.totalTtc > 0 ? ` (${formatDiscount("percent", Math.round((a.amountDue / a.totalTtc) * 10000) / 100)})` : ""}`}
                value={formatEuro(a.amountDue)}
              />
            ) : null}
            {doc.deductions.map((d, i) => (
              <TotalRow
                key={i}
                s={s}
                label={`${d.label}${d.number ? ` · ${d.number}` : ""}`}
                value={`−${formatEuro(d.amount)}`}
                color={green}
              />
            ))}

            <View style={s.grand}>
              <Text style={s.grandLabel}>{grandLabel}</Text>
              <Text style={s.grandValue}>{formatEuro(a.amountDue)}</Text>
            </View>
            {vatExempt ? <Text style={s.vat}>{terms.vatMention}</Text> : null}
            {isQuote && a.deposit > 0 ? (
              <>
                <Text style={s.after}>
                  Acompte à la commande
                  {doc.depositType === "percent" ? ` (${formatDiscount("percent", doc.depositValue)})` : ""} : {formatEuro(a.deposit)}
                </Text>
                <Text style={s.after}>Solde à la livraison : {formatEuro(a.balance)}</Text>
              </>
            ) : null}
            {isDeposit ? (
              <Text style={s.after}>Reste à facturer à la livraison : {formatEuro(a.totalTtc - a.amountDue)}</Text>
            ) : null}
          </View>
        </View>

        {/* Factures : mentions légales + coordonnées bancaires */}
        {isInvoice && (legalText || bankRows.length > 0) ? (
          <View style={s.section} wrap={false}>
            {legalText ? (
              <View style={s.col}>
                <Text style={s.label}>Mentions</Text>
                <Text style={[s.terms, { marginTop: 0 }]}>{legalText}</Text>
              </View>
            ) : null}
            {bankRows.length > 0 ? (
              <View style={legalText ? s.colRight : s.col}>
                <Text style={s.label}>Coordonnées bancaires</Text>
                {bankRows.map(([k, v]) => (
                  <View key={k} style={s.bankRow}>
                    <Text style={s.bankKey}>{k}</Text>
                    <Text style={s.bankVal}>{v}</Text>
                  </View>
                ))}
              </View>
            ) : null}
          </View>
        ) : null}

        {/* Devis : conditions */}
        {isQuote ? (
          <View style={s.section} wrap={false}>
            <View style={s.col}>
              <Text style={s.label}>Conditions</Text>
              <Text style={s.small}>
                {[
                  doc.paymentTerms,
                  a.deposit > 0 ? `Acompte de ${formatEuro(a.deposit)} demandé à la validation du devis.` : "",
                  `Devis valable jusqu'au ${frDate(doc.validUntil)}.`,
                ]
                  .filter(Boolean)
                  .join(" ")}
              </Text>
            </View>
          </View>
        ) : null}

        {isQuote && legalText ? <Text style={s.terms}>{legalText}</Text> : null}

        <View style={s.footer} fixed>
          <Text style={{ flex: 1 }}>{legalFooter}</Text>
          {ctx.slogan ? <Text style={s.forge}>{ctx.slogan.toUpperCase()}</Text> : null}
        </View>
      </Page>
    </Document>
  );
}
