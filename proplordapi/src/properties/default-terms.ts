export interface TermClause {
  title: string;
  body: string;
  /** Required clauses must be followed; optional ones are guidelines. */
  required: boolean;
}

/** Starting point for every property until the landlord edits it. */
export const DEFAULT_TERMS: TermClause[] = [
  {
    title: 'Rent payment',
    body: 'Rent is paid in advance on or before the due date, using the payment plan agreed with the landlord (for example monthly or bi-weekly). Every payment is recorded and a receipt is issued.',
    required: true,
  },
  {
    title: 'Security deposit',
    body: 'A refundable security deposit is paid before moving in. It is returned at the end of the tenancy after deducting unpaid rent and damage beyond normal wear and tear.',
    required: true,
  },
  {
    title: 'Utilities and services',
    body: 'Unless agreed otherwise, the tenant pays for their own electricity, water and any other metered services, and keeps these accounts up to date.',
    required: true,
  },
  {
    title: 'Use of the premises',
    body: 'The premises are used only for the purpose agreed. Illegal activity and anything that endangers other residents or the building is not allowed.',
    required: true,
  },
  {
    title: 'Care and maintenance',
    body: 'The tenant keeps the unit clean and reports damage or faults to the caretaker or landlord promptly. Repairs caused by misuse are paid for by the tenant.',
    required: true,
  },
  {
    title: 'Noise and conduct',
    body: 'Respect your neighbours. Keep noise low, especially at night, and keep shared areas clean and clear.',
    required: false,
  },
  {
    title: 'Visitors and subletting',
    body: 'Short visits are welcome. The unit may not be sublet or shared with additional long-term occupants without the landlord’s written consent.',
    required: false,
  },
  {
    title: 'Access by the landlord',
    body: 'The landlord or caretaker may enter the unit for inspections and repairs after giving reasonable notice, or immediately in an emergency.',
    required: false,
  },
  {
    title: 'Ending the tenancy',
    body: 'Either side gives at least one month’s written notice before ending the tenancy. The unit is returned clean and in good condition.',
    required: true,
  },
];
