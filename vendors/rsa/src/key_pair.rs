use crate::KeyPair;
use num_bigint::{BigUint, RandBigInt};

pub fn generate_keys_stub(key_size: u64) -> KeyPair {
    KeyPair {
        public_key: generate_prime(key_size).to_string(),
        private_key: generate_prime(key_size).to_string(),
    }
}

fn generate_prime(bits: u64) -> BigUint {
    let mut rng = rand::thread_rng();
    let mut n = rng.gen_biguint(bits);

    loop {
        if n.bit(0) {
            n += 2u8;
        } else {
            n += 1u8;
        }

        if is_prime(&n) {
            return n;
        }
    }
}

fn is_prime(number: &BigUint) -> bool {
    miller_rabin(number, 10)
}

fn miller_rabin(n: &BigUint, k: u32) -> bool {
    let n_minus_1 = n - 1u8;
    let d = n_minus_1.to_usize().unwrap();
    let r = n_minus_1.bits() - d.trailing_zeros() as usize;
    let mut rng = rand::thread_rng();

    'next: for _ in 0..k {
        let a = loop {
            let x = rng.gen_biguint_below(n);
            if x > BigUint::one() && x < n_minus_1 {
                break x;
            }
        };

        let mut x = a.modpow(&BigUint::from(d), n);
        if x == 1u8 || x == n_minus_1 {
            continue 'next;
        }

        for _ in 0..r - 1 {
            x = x.modpow(&BigUint::from(2u32), n);
            if x == n_minus_1 {
                continue 'next;
            }
        }

        return false;
    }

    true
}
