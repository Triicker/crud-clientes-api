# Page snapshot

```yaml
- generic [ref=e2]:
  - banner [ref=e3]:
    - generic [ref=e4]:
      - heading "Sistema de Gerenciamento de Clientes" [level=1] [ref=e5]
      - generic [ref=e6]: Sistema Online
  - generic [ref=e7]:
    - generic [ref=e8]:
      - generic [ref=e9]:
        - img
        - textbox "Buscar por nome, cidade, CNPJ, telefone..." [ref=e10]
      - generic [ref=e11]:
        - combobox [ref=e12] [cursor=pointer]:
          - option "Carregando estados..." [selected]
        - combobox [ref=e13] [cursor=pointer]:
          - option "Todas as Cidades" [selected]
        - combobox [ref=e14] [cursor=pointer]:
          - option "Todas as Microrregiões" [selected]
        - combobox [ref=e15] [cursor=pointer]:
          - option "Todos os Tipos" [selected]
          - option "Rede de Ensino"
          - option "Escola"
        - button "Limpar Filtros" [ref=e16] [cursor=pointer]:
          - img [ref=e17]
          - text: Limpar Filtros
    - generic [ref=e23]: 0 clientes encontrados
  - generic [ref=e24]:
    - img [ref=e26]
    - heading "Nenhum cliente encontrado" [level=3] [ref=e31]
    - paragraph [ref=e32]: Tente ajustar os filtros ou termos de busca
```