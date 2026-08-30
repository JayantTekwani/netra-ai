import unittest
from merkle_vault import MerkleVault, verify_proof, hash_data

class TestMerkleVault(unittest.TestCase):

    def test_hash_data_types(self):
        h1 = hash_data({"b": 2, "a": 1})
        h2 = hash_data({"a": 1, "b": 2})
        self.assertEqual(h1, h2, "Canonical JSON hashing failed to sort keys.")

    def test_single_leaf_merkle_tree(self):
        v = MerkleVault(raw_elements=["single_item"])
        proof = v.get_proof(0)
        self.assertTrue(verify_proof(v.leaves[0], proof, v.root))

    def test_power_of_two_leaves(self):
        data = ["a", "b", "c", "d"]
        v = MerkleVault(raw_elements=data)
        for i in range(len(data)):
            proof = v.get_proof(i)
            self.assertTrue(verify_proof(v.leaves[i], proof, v.root))

    def test_odd_number_of_leaves(self):
        data = ["leaf1", "leaf2", "leaf3", "leaf4", "leaf5"]
        v = MerkleVault(raw_elements=data)
        for i in range(len(data)):
            proof = v.get_proof(i)
            self.assertTrue(verify_proof(v.leaves[i], proof, v.root))

    def test_tampering_detection(self):
        v = MerkleVault(raw_elements=["valid_1", "valid_2"])
        proof = v.get_proof(0)
        fake_leaf = hash_data("tampered_content")
        self.assertFalse(verify_proof(fake_leaf, proof, v.root))

    def test_out_of_bounds_index(self):
        v = MerkleVault(raw_elements=["elem1", "elem2"])
        with self.assertRaises(IndexError):
            v.get_proof(5)

if __name__ == "__main__":
    unittest.main()