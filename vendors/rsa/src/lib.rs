mod key_pair;
mod utils;

extern crate wasm_bindgen;

use futures::future::{err, ok};
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use wasm_bindgen_futures::future_to_promise;

use crate::key_pair::generate_keys_stub;

#[cfg(feature = "wee_alloc")]
#[global_allocator]
static ALLOC: wee_alloc::WeeAlloc = wee_alloc::WeeAlloc::INIT;
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct KeyPair {
    // Тут могут быть ваши структуры для ключей
    private_key: String,
    public_key: String,
}

#[wasm_bindgen]
impl KeyPair {
    #[wasm_bindgen(getter)]
    pub fn private_key(&self) -> JsValue {
        JsValue::from_str(&self.private_key)
    }

    #[wasm_bindgen(getter)]
    pub fn public_key(&self) -> JsValue {
        JsValue::from_str(&self.public_key)
    }
}

// Заглушки для функций шифрования и дешифрования
fn encrypt_stub(_public_key: &str, _message: &str) -> Result<String, &'static str> {
    Ok("encrypted_message".to_string())
}

fn decrypt_stub(_private_key: &str, _encrypted_message: &str) -> Result<String, &'static str> {
    Ok("decrypted_message".to_string())
}

#[wasm_bindgen(js_name = "generateKeyPair")]
pub fn generate_keypair(size: u32) -> js_sys::Promise {
    let future = futures::executor::block_on(async {
        let key = generate_keys_stub(size as u64);

        match serde_wasm_bindgen::to_value(&key) {
            Ok(js_value) => ok(js_value),
            Err(e) => err(JsValue::from_str(&format!("{}", e))),
        }
    });

    future_to_promise(future)
}

#[wasm_bindgen]
pub fn encrypt(public_key: String, message: String) -> js_sys::Promise {
    let future = futures::executor::block_on(async {
        match encrypt_stub(&public_key, &message) {
            Ok(encrypted_message) => ok(JsValue::from_str(&encrypted_message)),
            Err(e) => err(JsValue::from_str(e)),
        }
    });

    future_to_promise(future)
}

#[wasm_bindgen]
pub fn decrypt(private_key: String, encrypted_message: String) -> js_sys::Promise {
    let future = futures::executor::block_on(async {
        match decrypt_stub(&private_key, &encrypted_message) {
            Ok(decrypted_message) => ok(JsValue::from_str(&decrypted_message)),
            Err(e) => err(JsValue::from_str(e)),
        }
    });

    future_to_promise(future)
}
