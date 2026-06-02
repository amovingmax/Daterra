# Notas de Revisão — App Store Connect (item 6)

Cole o conteúdo abaixo em **App Store Connect → seu app → App Review Information → Notes**,
e preencha os campos de login em **Sign-In Information**.

> Estes textos pressupõem que a conta demo foi criada com
> `packages/database/scripts/seed-demo-account.mjs`. Se você mudar e-mail/senha lá,
> atualize aqui também.

---

## Sign-In Information (campos do App Store Connect)

- **Sign-in required:** Yes
- **User name:** `revisor.appstore@daterra.app`
- **Password:** `DaTerra#Review2026`

---

## Notes (cole no campo "Notes")

```
O Da Terra é um marketplace de produtos com o Selo Feito Potiguar (Rio Grande do
Norte, Brasil). O conteúdo (lojas e produtos) é regional — para ver catálogo com
estoque, use um CEP de Natal/RN, por exemplo 59020-000.

COMO TESTAR
1) O app abre direto no catálogo, SEM exigir login (modo visitante).
2) Para testar o fluxo de conta (endereços, pedidos), entre com:
   e-mail: revisor.appstore@daterra.app
   senha:  DaTerra#Review2026
3) Login social (Google / Apple) também está disponível na tela de entrada.

PAGAMENTO
Vendemos BENS FÍSICOS (alimentos) entregues fora do app. Conforme a Guideline
3.1.3(e), o pagamento NÃO usa In-App Purchase — é feito por meio externo
(cartão / Pix). Portanto não há itens de IAP a revisar.

EXCLUSÃO DE CONTA
Disponível no app em: Perfil → Excluir minha conta (Guideline 5.1.1(v)).

CONTATO
Suporte: contato@daterra.app
```

---

## ⚠️ Pendências que afetam estas notas (não são do item 6, mas avisam o revisor)

- **Pagamento (item 5):** hoje o checkout está **simulado** (marca o pedido como pago
  sem cobrança real). Se for submeter assim, o trecho "PAGAMENTO" acima fica
  **inconsistente** com o app e vira risco de rejeição por app incompleto
  (Guideline 2.1). A conta demo só fica 100% válida depois que o item 5 for resolvido.
- **Política de Privacidade (item 4):** o link/URL precisa existir antes de submeter;
  o revisor verifica.
