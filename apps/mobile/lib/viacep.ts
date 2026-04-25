/**
 * Lookup de CEP via ViaCEP. Free, sem key, retorna 200 com `erro: true` quando não acha.
 * https://viacep.com.br/
 */
export interface ViaCEPAddress {
  zip_code: string;
  street: string;
  district: string;
  city: string;
  state: string;
}

export async function fetchAddressByCEP(cep: string): Promise<ViaCEPAddress | null> {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;

  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    if (!response.ok) return null;
    const data = (await response.json()) as {
      erro?: boolean;
      cep: string;
      logradouro: string;
      bairro: string;
      localidade: string;
      uf: string;
    };
    if (data.erro) return null;
    return {
      zip_code: digits,
      street: data.logradouro,
      district: data.bairro,
      city: data.localidade,
      state: data.uf,
    };
  } catch {
    return null;
  }
}
