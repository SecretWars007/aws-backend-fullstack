"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParametersUseCase = void 0;
class ParametersUseCase {
    constructor(customerRepo) {
        this.customerRepo = customerRepo;
    }
    async execute(customerId) {
        const customer = await this.customerRepo.findCustomerById(customerId);
        const name = customer?.name ?? 'Gus';
        return {
            greeting: `¡Hola ${name}!`,
            show_dialog: false,
        };
    }
}
exports.ParametersUseCase = ParametersUseCase;
//# sourceMappingURL=ParametersUseCase.js.map