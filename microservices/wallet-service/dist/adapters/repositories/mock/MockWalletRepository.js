"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MockWalletRepository = void 0;
class MockWalletRepository {
    constructor() {
        this.cards = new Map(); // customerId -> WalletCard[]
        this.movements = new Map(); // customerId -> WalletMovement[]
        this.transferSessions = new Map(); // token_customerId -> TransferSession
        this.nextMovementId = 1000;
        // Seed default cards and actions for Customer 3 (Gustavo Parker) to match PDF
        const gustavoCard = {
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
        const gustavoMovement = {
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
    getOrCreateCards(customerId, cellphone = '70000000') {
        if (!this.cards.has(customerId)) {
            const card = {
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
        return this.cards.get(customerId);
    }
    async createWalletCard(customerId, cellphone) {
        const cards = this.getOrCreateCards(customerId, cellphone);
        return cards[0];
    }
    async getWalletCards(customerId) {
        return this.getOrCreateCards(customerId);
    }
    async getMovements(customerId) {
        return this.movements.get(customerId) ?? [];
    }
    async getRechargeProviders() {
        return [
            { name: 'Tigo', code: 12, logo: 'https://assets.zappi.com/logos/tigo.png' },
            { name: 'Entel', code: 13, logo: 'https://assets.zappi.com/logos/entel.png' },
            { name: 'Viva', code: 14, logo: 'https://assets.zappi.com/logos/viva.png' },
        ];
    }
    async recharge(customerId, providerCode, cellphone, amount) {
        const cards = this.getOrCreateCards(customerId);
        const card = cards[0];
        if (card.balance < amount) {
            throw new Error('INSUFFICIENT_FUNDS');
        }
        card.balance -= amount;
        let providerName = 'ENTEL';
        if (providerCode === 12)
            providerName = 'TIGO';
        if (providerCode === 14)
            providerName = 'VIVA';
        const movement = {
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
    async createTransferSession(customerId, cellphone, amount, token) {
        const id = Math.floor(Math.random() * 10000);
        const session = {
            id,
            customerId,
            cellphone,
            amount,
            token,
            expiresAt: new Date(Date.now() + 3 * 60 * 1000), // 3 min expiry
        };
        this.transferSessions.set(`${token}_${customerId}`, session);
        return session;
    }
    async getTransferSession(customerId, token) {
        return this.transferSessions.get(`${token}_${customerId}`) ?? null;
    }
    async deleteTransferSession(id) {
        for (const [key, session] of this.transferSessions.entries()) {
            if (session.id === id) {
                this.transferSessions.delete(key);
                break;
            }
        }
    }
    async validateTargetCellphone(cellphone) {
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
    async executeTransfer(fromCustomerId, toCellphone, amount) {
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
        const movement = {
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
exports.MockWalletRepository = MockWalletRepository;
//# sourceMappingURL=MockWalletRepository.js.map