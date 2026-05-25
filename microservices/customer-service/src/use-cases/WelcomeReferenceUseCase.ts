export class WelcomeReferenceUseCase {
  async execute(): Promise<never> {
    throw new Error('INTENTIONAL_404');
  }
}
