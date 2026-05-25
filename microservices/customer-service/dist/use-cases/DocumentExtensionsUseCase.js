"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentExtensionsUseCase = void 0;
class DocumentExtensionsUseCase {
    constructor(customerRepo) {
        this.customerRepo = customerRepo;
    }
    async execute() {
        const extensions = await this.customerRepo.getExtensions();
        return { extensions };
    }
}
exports.DocumentExtensionsUseCase = DocumentExtensionsUseCase;
//# sourceMappingURL=DocumentExtensionsUseCase.js.map