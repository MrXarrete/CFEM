import tkinter as tk
from tkinter import messagebox
import re
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException, NoSuchElementException, ElementClickInterceptedException
import time
import os

# --- Funções de Validação de CPF/CNPJ (Etapa 2) ---

def is_cpf_valid(cpf: str) -> bool:
    """Valida um CPF."""
    cpf = ''.join(re.findall(r'\d', cpf))
    if len(cpf) != 11 or len(set(cpf)) == 1:
        return False
    for i in range(9, 11):
        value = sum((int(cpf[num]) * ((i + 1) - num) for num in range(0, i)))
        digit = ((value * 10) % 11) % 10
        if str(digit) != cpf[i]:
            return False
    return True

def is_cnpj_valid(cnpj: str) -> bool:
    """Valida um CNPJ."""
    cnpj = ''.join(re.findall(r'\d', cnpj))
    if len(cnpj) != 14 or len(set(cnpj)) == 1:
        return False
    
    # Valida o primeiro dígito verificador
    soma = 0
    peso = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    for i in range(12):
        soma += int(cnpj[i]) * peso[i]
    resto = soma % 11
    digito_verificador_1 = 0 if resto < 2 else 11 - resto
    if digito_verificador_1 != int(cnpj[12]):
        return False

    # Valida o segundo dígito verificador
    soma = 0
    peso = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    for i in range(13):
        soma += int(cnpj[i]) * peso[i]
    resto = soma % 11
    digito_verificador_2 = 0 if resto < 2 else 11 - resto
    if digito_verificador_2 != int(cnpj[13]):
        return False
        
    return True

def validate_data(data):
    """Verifica se os dados inseridos pelo usuário são válidos."""
    # Valida CPF/CNPJ
    cpf_cnpj = data['cpf_cnpj'].strip()
    if not cpf_cnpj:
        messagebox.showerror("Erro de Validação", "O campo CPF/CNPJ é obrigatório.")
        return False
    
    doc_sem_formatacao = ''.join(re.findall(r'\d', cpf_cnpj))
    if len(doc_sem_formatacao) == 11:
        if not is_cpf_valid(doc_sem_formatacao):
            messagebox.showerror("Erro de Validação", "CPF inválido.")
            return False
    elif len(doc_sem_formatacao) == 14:
        if not is_cnpj_valid(doc_sem_formatacao):
            messagebox.showerror("Erro de Validação", "CNPJ inválido.")
            return False
    else:
        messagebox.showerror("Erro de Validação", "CPF/CNPJ com número de dígitos incorreto.")
        return False

    # Valida o Mês de Apuração (formato MM/AAAA)
    if not re.match(r"^(0[1-9]|1[0-2])\/\d{4}$", data['mes_apuracao']):
        messagebox.showerror("Erro de Validação", "Formato do Mês de Apuração inválido. Use MM/AAAA.")
        return False
        
    # Valida campos numéricos
    try:
        float(data['valor_venda'].replace('.', '').replace(',', '.'))
        float(data['qtd_venda'].replace('.', '').replace(',', '.'))
    except ValueError:
        messagebox.showerror("Erro de Validação", "Os campos de valor e quantidade devem ser numéricos.")
        return False

    # Outras validações simples
    for key, field_name in {
        'processo': 'Número do Processo',
        'substancia': 'Substância',
        'unidade': 'Unidade de Medida',
        'municipio': 'Município',
        'ncm': 'Código NCM'
    }.items():
        if not data[key].strip():
            messagebox.showerror("Erro de Validação", f"O campo '{field_name}' é obrigatório.")
            return False
            
    return True


# --- Interface Gráfica (Etapa 1) ---

class DataCollectorApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Automação ANM - Inserir Dados")
        self.root.geometry("450x400")

        self.data = None

        tk.Label(root, text="Preencha os dados para emissão do boleto:", font=('Helvetica', 12, 'bold')).pack(pady=10)

        # Campos
        fields = {
            'cpf_cnpj': 'CPF ou CNPJ do Requerente:',
            'processo': 'Número do Processo (Ex: 800.000/2020):',
            'substancia': 'Substância (nome exato como na página):',
            'unidade': 'Unidade de Medida (Ex: Tonelada):',
            'municipio': 'Município (Ex: BELO HORIZONTE/MG):',
            'mes_apuracao': 'Mês de Apuração (MM/AAAA):',
            'valor_venda': 'Valor da Venda (Merc. Interno - R$):',
            'qtd_venda': 'Quantidade da Venda (Merc. Interno):',
            'ncm': 'Código NCM (Ex: 2601.11.00):'
        }
        
        self.entries = {}
        for key, text in fields.items():
            frame = tk.Frame(root)
            frame.pack(fill='x', padx=10, pady=2)
            label = tk.Label(frame, text=text, width=35, anchor='w')
            label.pack(side='left')
            entry = tk.Entry(frame)
            entry.pack(side='right', expand=True, fill='x')
            self.entries[key] = entry
        
        # Botão
        submit_button = tk.Button(root, text="Iniciar Automação", command=self.submit, bg='#4CAF50', fg='white', font=('Helvetica', 10, 'bold'))
        submit_button.pack(pady=20)

    def submit(self):
        self.data = {key: entry.get() for key, entry in self.entries.items()}
        if validate_data(self.data):
            self.root.destroy()
        else:
            self.data = None # Reseta os dados se a validação falhar

# --- Função de Automação com Selenium (Etapa 3) ---

def fill_form_and_issue_boleto(data):
    """Controla o navegador para preencher o formulário e emitir o boleto."""
    
    # URL do sistema de boletos da ANM
    url = "https://apps.anm.gov.br/BoletosCfem/NaoDivida/CFEM"
    
    # Configura o driver do Selenium
    options = webdriver.ChromeOptions()
    options.add_experimental_option("excludeSwitches", ["enable-automation"]) # Para evitar que o site detecte a automação
    driver = webdriver.Chrome(options=options)
    
    try:
        driver.get(url)
        wait = WebDriverWait(driver, 20) # Aumenta o tempo de espera para 20 segundos

        print("Página carregada. Preenchendo formulário...")
        
        # 1. Preencher CPF/CNPJ e esperar a resposta do servidor
        print(f"Preenchendo CPF/CNPJ: {data['cpf_cnpj']}")
        cpf_cnpj_input = wait.until(EC.visibility_of_element_located((By.ID, "cpfCnpj")))
        cpf_cnpj_input.send_keys(data['cpf_cnpj'])
        
        # Clica em outro lugar para disparar o evento de 'blur' e carregar os processos
        driver.find_element(By.TAG_NAME, 'body').click()
        
        # Espera pelo modal de "Processando..." desaparecer
        wait.until(EC.invisibility_of_element_located((By.ID, "processing-modal")))
        print("CPF/CNPJ processado.")

        # 2. Preencher o Número do Processo
        print(f"Preenchendo Processo: {data['processo']}")
        processo_input = wait.until(EC.visibility_of_element_located((By.ID, "nproc")))
        processo_input.send_keys(data['processo'])
        driver.find_element(By.TAG_NAME, 'body').click()
        wait.until(EC.invisibility_of_element_located((By.ID, "processing-modal")))
        print("Processo processado.")
        
        # Espera as listas de Substância e Município serem carregadas
        print("Aguardando carregamento das listas...")
        wait.until(EC.presence_of_element_located((By.XPATH, "//select[@id='cbSubstancia']/option[2]")))
        wait.until(EC.presence_of_element_located((By.XPATH, "//select[@id='cbMunicipio']/option[2]")))
        print("Listas carregadas.")
        
        # 3. Selecionar Substância, Unidade e Município
        Select(driver.find_element(By.ID, "cbSubstancia")).select_by_visible_text(data['substancia'])
        print(f"Substância selecionada: {data['substancia']}")
        
        wait.until(EC.presence_of_element_located((By.XPATH, "//select[@id='cbUnidadeMedida']/option[2]")))
        Select(driver.find_element(By.ID, "cbUnidadeMedida")).select_by_visible_text(data['unidade'])
        print(f"Unidade selecionada: {data['unidade']}")
        
        Select(driver.find_element(By.ID, "cbMunicipio")).select_by_visible_text(data['municipio'])
        print(f"Município selecionado: {data['municipio']}")

        # 4. Preencher demais campos
        driver.find_element(By.ID, "mesApuracao").send_keys(data['mes_apuracao'])
        print(f"Mês de apuração: {data['mes_apuracao']}")

        driver.find_element(By.ID, "valorVendaMercadoInterno").send_keys(data['valor_venda'])
        print(f"Valor da venda: {data['valor_venda']}")
        
        driver.find_element(By.ID, "qtdVendaMercadoInterno").send_keys(data['qtd_venda'])
        print(f"Quantidade da venda: {data['qtd_venda']}")

        driver.find_element(By.ID, "codigoNCMMinterno").send_keys(data['ncm'])
        print(f"Código NCM: {data['ncm']}")

        # 5. Clicar em "Calcular Valor"
        print("Calculando valor...")
        # Usa JavaScript para clicar, evitando problemas de sobreposição de elementos
        calc_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Calcular Valor')]")))
        driver.execute_script("arguments[0].click();", calc_button)
        
        # 6. Esperar e clicar em "Emitir guia de recolhimento"
        print("Aguardando botão para emitir boleto...")
        emitir_button = wait.until(EC.element_to_be_clickable((By.XPATH, "//a[contains(., 'Emitir guia de recolhimento')]")))
        
        # Salva o handle da janela atual para poder voltar se necessário
        janela_principal = driver.current_window_handle
        
        print("Emitindo boleto...")
        emitir_button.click()
        
        # Espera a nova aba do boleto abrir e foca nela
        wait.until(EC.number_of_windows_to_be(2))
        for handle in driver.window_handles:
            if handle != janela_principal:
                driver.switch_to.window(handle)
                break
        
        print("\nSucesso! O boleto foi gerado em uma nova aba do navegador.")
        print("O navegador permanecerá aberto por 2 minutos para sua conveniência.")
        time.sleep(120)

    except TimeoutException:
        messagebox.showerror("Erro de Automação", "Um elemento não foi encontrado a tempo. Verifique sua conexão ou se a página mudou.")
    except NoSuchElementException as e:
        messagebox.showerror("Erro de Automação", f"Elemento não encontrado: {e}. A estrutura da página pode ter mudado.")
    except ElementClickInterceptedException:
        messagebox.showerror("Erro de Automação", "Não foi possível clicar em um botão. Um elemento pode estar sobrepondo o outro.")
    except Exception as e:
        messagebox.showerror("Erro Inesperado", f"Ocorreu um erro: {e}")
    finally:
        print("Fechando o navegador.")
        driver.quit()


# --- Execução Principal ---

if __name__ == "__main__":
    root = tk.Tk()
    app = DataCollectorApp(root)
    root.mainloop()

    if app.data:
        print("Dados coletados com sucesso. Iniciando automação no navegador...")
        fill_form_and_issue_boleto(app.data)
    else:
        print("Operação cancelada pelo usuário ou dados inválidos.")