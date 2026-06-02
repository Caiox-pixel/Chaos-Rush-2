# 🤖 Bastião de Engrenagens - Implementação

## Overview
Novo personagem **Bastião** (Karg, o Bastião de Engrenagens) foi adicionado ao jogo. Um tanque mecânico que converte dano recebido em poder.

---

## 📋 Ficha do Personagem

### Lore
Karg era um mestre de obras em cercos militares que, após ser soterrado, fundiu peças mecânicas ao seu corpo criando um exoesqueleto rudimentar movido a molas e pressão interna. Ele luta como uma máquina programada para avançar e nunca retroceder.

### Estética
- **Silhueta**: Larga e quadrada, mais objeto que pessoa
- **Detalhes**: Braço mecânico desproporcional, chaminé nas costas com fumaça preta, elmo de grade
- **Feedback**: Som de THUD ao andar, jatos de vapor em idle

### Arma: Pilar de Combustão
Marreta gigante com base de estaca de perfuração. Golpes lentos mas pesados com centelhas e explosão de fuligem ao impacto.

---

## ⚙️ Mecânicas

### Passiva: Válvula de Sacrifício (Recurso: Calor)
- **Acúmulo de Calor**:
  - +15% do dano recebido como calor
  - +5 pontos de calor por ataque
  
- **Superaquecimento** (ao atingir 100% de calor):
  - Velocidade: +40%
  - Dano: +25%
  - Duração: 6 segundos
  - Perda de vida gradual
  - Automaticamente volta ao normal após 6s

- **Estratégia**: Quanto mais você recebe dano, mais forte fica!

### Stats Base
| Stat | Valor |
|------|-------|
| HP Máximo | 160 |
| Armadura | 6 |
| Dano Multiplier | 1.15x |
| Attack Speed | 0.8x (mais lento) |
| Aura Range | 140 |

### Arma: Pilar de Combustão
- **Cooldown**: 1200ms
- **Dano Base**: 20 (multiplicado por calor)
- **Raio**: 100 (AoE ajustável)
- **Efeito**: 
  - Cria explosão visual no impacto
  - Dano aumenta com calor acumulado
  - Cada ataque gera +8 de calor (feedback mecânico)

---

## 📂 Arquivos Criados/Modificados

### Criados
1. **`PassiveBastiao.js`** - Sistema de passiva com gerenciamento de calor

### Modificados
1. **`PlayerClass.js`** - Adicionado config "bastiao" com stats e animations
2. **`ClassSystems.js`** - Adicionado BASTION à lista de classes
3. **`WeaponSystem.js`** - Adicionado caso `pilarCombustao` e método `_usePilarCombustao()`

---

## 🎮 Como Usar

### Seleção
O Bastião aparece no menu de seleção de classe com ícone ⚙️

### Gameplay
1. **Recebia dano?** → Ganho calor automaticamente
2. **Atingiu 100% de calor?** → Superaquecimento ativa
3. **Durante superaquecimento**:
   - Você é 40% mais rápido
   - Seus ataques dão 25% mais dano
   - Você perde vida gradualmente
   - Dura 6 segundos

### Estratégia
- Posicione-se na frente para absorver dano
- Seu dano recebido é seu poder
- Sincronize ataques com o superaquecimento para máximo dano
- Ideal como iniciador/tanque do time

---

## 🔧 Configuração

### Heat Bar HUD
Barra visual no topo da tela mostrando % de calor:
- Cor branca: Normal
- Cor laranja: Aquecido (>75%)
- Cor amarela: Superaquecimento ativo

### Integração
A passiva se integra automaticamente com:
- Sistema de dano do player
- Sistema de cooldown da arma
- HUD de feedback visual
- Eventos de ataque e dano

---

## 🚀 Próximos Passos (Opcional)

- [ ] Adicionar texture/sprite próprio
- [ ] Adicionar sons de máquina pesada
- [ ] Implementar habilidades especiais (Avanço Hidráulico, Descarga de Pressão, Modo Demolição)
- [ ] Ajustar valores de calor baseado em playtesting
- [ ] Adicionar efeitos de partícula na explosão do Pilar

---

## ✅ Status

**Implementação**: ✓ Completa
**Testes**: Pronto para playtesting
**Documentação**: ✓ Atualizada
