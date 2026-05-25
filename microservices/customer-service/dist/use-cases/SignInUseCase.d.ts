import { ICustomerRepository } from '../domain/repositories/ICustomerRepository';
export interface SignInInput {
    mobile_number: string;
    pin: string;
    application?: string;
    certified_id: number;
    device_id?: string;
    device_name?: string;
    device_os?: string;
    is_root?: boolean;
    notification_id?: string;
    version?: string;
    auth_token: string;
}
export interface SignInOutput {
    private_token: string;
    mobile_number: string;
    time_session: number;
    name: string;
    last_name: string;
    second_last_name: string;
    document_number: string;
    document_extension: string;
    document_type: string;
    email: string;
    city: string;
    id: number;
    register_completed: boolean;
    is_client: boolean;
    number_show_form: number;
    business: string;
    RegisterShowForm: boolean;
}
export declare class SignInUseCase {
    private readonly customerRepo;
    constructor(customerRepo: ICustomerRepository);
    execute(input: SignInInput): Promise<SignInOutput>;
}
