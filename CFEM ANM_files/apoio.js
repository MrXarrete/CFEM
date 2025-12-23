function somenteNumero(string) {
	var numsStr = string.replace(/[^0-9]/g, '');
	return numsStr;
}


function validaCpfCnpj(valor) {
	valor = somenteNumero(valor);
	if (valor.length <= 11)
		return validaCpf(valor);
	else
		return validaCnpj(valor);

}


/****************************************************************
* VALIDACAO DE CPF                                              *
*****************************************************************
* checaCPF(document.cadastro.cpf.value)
*/

function validaCpf(CPF) {
	if (CPF.length != 11 ||
		CPF == "00000000000" || CPF == "11111111111" || CPF == "33333333333" ||
			CPF == "44444444444" || CPF == "55555555555" || CPF == "66666666666" || CPF == "77777777777" ||
				CPF == "88888888888" || CPF == "99999999999" || CPF == "01234567890") {
		return true;
	} else {
		soma = 0;
		for (i = 0; i < 9; i++) {
			soma += parseInt(CPF.charAt(i)) * (10 - i);
		}
		resto = 11 - (soma % 11);
		if (resto > 9) {
			resto = 0;
		}
		if (resto != parseInt(CPF.charAt(9))) {
			return true;
		} else {
			soma = 0;
			for (i = 0; i < 10; i++) {
				soma += parseInt(CPF.charAt(i)) * (11 - i);
			}
			resto = 11 - (soma % 11);
			if (resto > 9) {
				resto = 0;
			}
			if (resto != parseInt(CPF.charAt(10))) {
				return true;
			}
		}
	}
	return false;
}

/****************************************************************
* VALIDACAO DE CNPJ                                             *
*****************************************************************
* checaCNPJ(document.cadastro.cpf.value)
*/

function validaCnpj(CNPJ) {
	if (CNPJ.length != 14) {
		return true;
	} else {
		var dig1 = 0;
		var dig2 = 0;
		var x;
		var Mult1 = '543298765432';
		var Mult2 = '6543298765432';
		for (x = 0; x <= 11; x++) {
			dig1 = dig1 + (parseInt(CNPJ.slice(x, x + 1)) * parseInt(Mult1.slice(x, x + 1)));
		}
		for (x = 0; x <= 12; x++) {
			dig2 = dig2 + (parseInt(CNPJ.slice(x, x + 1)) * parseInt(Mult2.slice(x, x + 1)));
		}
		dig1 = (dig1 * 10) % 11;
		dig2 = (dig2 * 10) % 11;
		if (dig1 == 10) {
			dig1 = 0;
		}
		if (dig2 == 10) {
			dig2 = 0;
		}
		if (dig1 != parseInt(CNPJ.slice(12, 13))) {
			return true;
		} else {
			if (dig2 != parseInt(CNPJ.slice(13, 14))) {
				return true;
			} else {
				return false;
			}
		}
	}
}


function formataCpfCnpj(v) {
	v = somenteNumero(v)
	if (v.length <= 11)
		return formataCpf(v);
	else
		return formataCnpj(v);
}

function formataCpf(v) {
	v = v.replace(/\D/g, ""); //Remove tudo o que não é dígito
	v = v.replace(/(\d{3})(\d)/, "$1.$2"); //Coloca um ponto entre o terceiro e o quarto dígitos
	v = v.replace(/(\d{3})(\d)/, "$1.$2"); //Coloca um ponto entre o terceiro e o quarto dígitos
	//de novo (para o segundo bloco de números)
	v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2"); //Coloca um hífen entre o terceiro e o quarto dígitos
	return v;
}

function formataCnpj(v) {
	v = v.replace(/\D/g, ""); //Remove tudo o que não é dígito
	v = v.replace(/^(\d{2})(\d)/, "$1.$2"); //Coloca ponto entre o segundo e o terceiro dígitos
	v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3"); //Coloca ponto entre o quinto e o sexto dígitos
	v = v.replace(/\.(\d{3})(\d)/, ".$1/$2"); //Coloca uma barra entre o oitavo e o nono dígitos
	v = v.replace(/(\d{4})(\d)/, "$1-$2"); //Coloca um hífen depois do bloco de quatro dígitos
	return v;
}