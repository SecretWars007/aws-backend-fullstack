import { IWalletRepository } from '../../../domain/repositories/IWalletRepository';
import { WalletCard, WalletMovement, RechargeProvider, TransferSession } from '../../../domain/entities/Wallet';

export class MockWalletRepository implements IWalletRepository {
  private readonly cards = new Map<number, WalletCard[]>(); // customerId -> WalletCard[]
  private readonly movements = new Map<number, WalletMovement[]>(); // customerId -> WalletMovement[]
  private readonly transferSessions = new Map<string, TransferSession>(); // token_customerId -> TransferSession
  private nextMovementId = 1000;

  constructor() {
    // Seed default cards and actions for Customer 3 (Gustavo Parker) to match PDF
    const gustavoCard: WalletCard = {
      id: 456789,
      customerId: 3,
      account: {
        number: '70000099',
        currency: 'BOL',
        type: 'BIL',
      },
      balance: 1250.50,
      pan: '',
      expirationDate: '',
      code: '',
      image: '',
      enable: true,
      createdAt: new Date(),
    };
    this.cards.set(3, [gustavoCard]);

    const gustavoMovement: WalletMovement = {
      id: 991,
      customerId: 3,
      date: '2026-05-10 09:00',
      amount: -50.00,
      currency: 'BOL',
      type: 12, // Tigo
      description: 'BL PAGO TIGO',
      detail: 'Recarga de crédito',
      destinationAccount: '77011223',
      destinationAccountName: null,
      createdAt: new Date(),
    };
    this.movements.set(3, [gustavoMovement]);
  }

  private getOrCreateCards(customerId: number, cellphone = '70000000'): WalletCard[] {
    if (!this.cards.has(customerId)) {
      const card: WalletCard = {
        id: Math.floor(Math.random() * 900000) + 100000,
        customerId,
        account: {
          number: cellphone,
          currency: 'BOL',
          type: 'BIL',
        },
        balance: 1250.50, // Spec default
        pan: '',
        expirationDate: '',
        code: '',
        image: '',
        enable: true,
        createdAt: new Date(),
      };
      this.cards.set(customerId, [card]);
    }
    return this.cards.get(customerId)!;
  }

  async createWalletCard(customerId: number, cellphone: string): Promise<WalletCard> {
    const cards = this.getOrCreateCards(customerId, cellphone);
    return cards[0];
  }

  async getWalletCards(customerId: number): Promise<WalletCard[]> {
    return this.getOrCreateCards(customerId);
  }

  async getMovements(customerId: number): Promise<WalletMovement[]> {
    return this.movements.get(customerId) ?? [];
  }

  async getRechargeProviders(): Promise<RechargeProvider[]> {
    return [
      { name: 'Tigo', code: 12, logo: 'https://assets.zappi.com/logos/tigo.png' },
      { name: 'Entel', code: 13, logo: 'https://assets.zappi.com/logos/entel.png' },
      { name: 'Viva', code: 14, logo: 'https://assets.zappi.com/logos/viva.png' },
    ];
  }

  async recharge(customerId: number, providerCode: number, cellphone: string, amount: number): Promise<WalletMovement> {
    const cards = this.getOrCreateCards(customerId);
    const card = cards[0];
    if (card.balance < amount) {
      throw new Error('INSUFFICIENT_FUNDS');
    }

    card.balance -= amount;

    let providerName = 'ENTEL';
    if (providerCode === 12) providerName = 'TIGO';
    if (providerCode === 14) providerName = 'VIVA';

    const movement: WalletMovement = {
      id: this.nextMovementId++,
      customerId,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      amount: -amount,
      currency: 'BOL',
      type: providerCode,
      description: `BL PAGO ${providerName}`,
      detail: 'Recarga de crédito',
      destinationAccount: cellphone,
      destinationAccountName: null,
      createdAt: new Date(),
    };

    const moves = this.movements.get(customerId) ?? [];
    moves.unshift(movement); // Newest first
    this.movements.set(customerId, moves);

    return movement;
  }

  async createTransferSession(customerId: number, cellphone: string, amount: number, token: string): Promise<TransferSession> {
    const id = Math.floor(Math.random() * 10000);
    const session: TransferSession = {
      id,
      customerId,
      cellphone,
      amount,
      token,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min expiry
    };
    this.transferSessions.set(`${token}_${customerId}`, session);
    return session;
  }

  async getTransferSession(customerId: number, token: string): Promise<TransferSession | null> {
    return this.transferSessions.get(`${token}_${customerId}`) ?? null;
  }

  async deleteTransferSession(id: number): Promise<void> {
    for (const [key, session] of this.transferSessions.entries()) {
      if (session.id === id) {
        this.transferSessions.delete(key);
        break;
      }
    }
  }

  async validateTargetCellphone(cellphone: string): Promise<{ name: string; id: number } | null> {
    // Normalise
    const phone = cellphone.replace(/^\+591/, '');
    
    // Simulate finding a customer
    if (phone === '70000099') {
      return { name: 'GUSTAVO PARKER', id: 3 };
    }
    
    if (phone.startsWith('7') || phone.startsWith('6')) {
      return { name: 'MARIA GOMEZ', id: 4 };
    }

    return null;
  }

  async executeTransfer(fromCustomerId: number, toCellphone: string, amount: number): Promise<WalletMovement> {
    const senderCards = this.getOrCreateCards(fromCustomerId);
    const senderCard = senderCards[0];
    if (senderCard.balance < amount) {
      throw new Error('INSUFFICIENT_FUNDS');
    }

    // Deduct from sender
    senderCard.balance -= amount;

    const recipient = await this.validateTargetCellphone(toCellphone);
    const recipientId = recipient ? recipient.id : 999;
    const recipientName = recipient ? recipient.name : 'USUARIO ZAPPI';

    // Add to recipient if they exist in cards Map
    if (recipientId !== 999) {
      const recCards = this.getOrCreateCards(recipientId, toCellphone);
      recCards[0].balance += amount;
      
      // Add incoming movement for recipient
      const recMoves = this.movements.get(recipientId) ?? [];
      recMoves.unshift({
        id: this.nextMovementId++,
        customerId: recipientId,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        amount: amount,
        currency: 'BOL',
        type: 1, // Transfer
        description: 'TRANSFERENCIA RECIBIDA',
        detail: 'Recibido de ' + senderCard.account.number,
        destinationAccount: senderCard.account.number,
        destinationAccountName: 'Remitente',
        createdAt: new Date(),
      });
      this.movements.set(recipientId, recMoves);
    }

    // Record outgoing movement for sender
    const movement: WalletMovement = {
      id: this.nextMovementId++,
      customerId: fromCustomerId,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      amount: -amount,
      currency: 'BOL',
      type: 1, // Transfer
      description: 'TRANSFERENCIA ENVIADA',
      detail: 'Enviado a ' + toCellphone,
      destinationAccount: toCellphone,
      destinationAccountName: recipientName,
      createdAt: new Date(),
    };

    const senderMoves = this.movements.get(fromCustomerId) ?? [];
    senderMoves.unshift(movement);
    this.movements.set(fromCustomerId, senderMoves);

    return movement;
  }
}
