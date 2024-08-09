'use client';

import { useState, useEffect } from 'react';
import { Box, Stack, Typography, Button, Modal, TextField, Select, MenuItem, IconButton } from '@mui/material';
import { firestore } from './firebase.js';
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  deleteDoc,
  getDoc,
  limit,
  startAfter,
  where,
} from 'firebase/firestore';
import DownloadIcon from '@mui/icons-material/Download';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { saveAs } from 'file-saver';
import Papa from 'papaparse';

const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 400,
  bgcolor: 'white',
  border: '2px solid #000',
  boxShadow: 24,
  p: 4,
  display: 'flex',
  flexDirection: 'column',
  gap: 3,
};

export default function Home() {
  const [inventory, setInventory] = useState([]);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [viewOpen, setViewOpen] = useState(false);  // New state for the view modal
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemSupplier, setItemSupplier] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lastVisible, setLastVisible] = useState(null);

  useEffect(() => {
    updateInventory();
  }, [categoryFilter]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => {
    setOpen(false);
    clearForm();
  };

  const handleEditOpen = (item) => {
    setItemName(item.name);
    setItemCategory(item.category);
    setItemDescription(item.description || '');
    setItemPrice(item.price || '');
    setItemSupplier(item.supplier || '');
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
    clearForm();
  };

  const handleViewOpen = () => setViewOpen(true);  // Open the view modal
  const handleViewClose = () => setViewOpen(false); // Close the view modal

  const clearForm = () => {
    setItemName('');
    setItemCategory('');
    setItemDescription('');
    setItemPrice('');
    setItemSupplier('');
  };

  const addItem = async (item, category, description, price, supplier) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      await setDoc(docRef, { quantity: quantity + 1, category, description, price, supplier });
    } else {
      await setDoc(docRef, { quantity: 1, category, description, price, supplier });
    }
    await updateInventory();
  };

  const updateItemDetails = async () => {
    const docRef = doc(collection(firestore, 'inventory'), itemName);
    await setDoc(docRef, { category: itemCategory, description: itemDescription, price: itemPrice, supplier: itemSupplier }, { merge: true });
    await updateInventory();
    handleEditClose();
  };

  const removeItem = async (item) => {
    const docRef = doc(collection(firestore, 'inventory'), item);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const { quantity } = docSnap.data();
      if (quantity === 1) {
        await deleteDoc(docRef);
      } else {
        await setDoc(docRef, { quantity: quantity - 1 });
      }
    }
    await updateInventory();
  };

  const updateInventory = async (isPaginating = false) => {
    const q = query(
      collection(firestore, 'inventory'),
      ...(categoryFilter ? [where('category', '==', categoryFilter)] : []),
      limit(10),
      ...(isPaginating && lastVisible ? [startAfter(lastVisible)] : [])
    );

    const docs = await getDocs(q);
    if (docs.docs.length === 0 && isPaginating) return;

    if (isPaginating) {
      setInventory((prev) => [...prev, ...docs.docs.map((doc) => ({ name: doc.id, ...doc.data() }))]);
    } else {
      setInventory(docs.docs.map((doc) => ({ name: doc.id, ...doc.data() })));
    }

    setLastVisible(docs.docs[docs.docs.length - 1]);
  };

  const handleExport = () => {
    const csv = Papa.unparse(inventory);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    saveAs(blob, 'inventory.csv');
  };

  const filteredInventory = inventory.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Box
      width="100vw"
      height="100vh"
      display={'flex'}
      justifyContent={'center'}
      flexDirection={'column'}
      alignItems={'center'}
      gap={2}
      padding={2}
    >
      <Box display="flex" gap={2} width="100%" maxWidth="800px">
        <TextField
          fullWidth
          label="Search"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
          }}
        />
        <Select
          fullWidth
          label="Filter by Category"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="Food">Food</MenuItem>
          <MenuItem value="Beverage">Beverage</MenuItem>
          <MenuItem value="Cleaning">Cleaning</MenuItem>
          <MenuItem value="Other">Other</MenuItem>
        </Select>
        <IconButton onClick={handleExport}>
          <DownloadIcon />
        </IconButton>
      </Box>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Add Item
          </Typography>
          <Stack width="100%" spacing={2}>
            <TextField
              label="Item"
              variant="outlined"
              fullWidth
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
            />
            <TextField
              label="Description"
              variant="outlined"
              fullWidth
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
            />
            <TextField
              label="Price"
              variant="outlined"
              fullWidth
              type="number"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
            />
            <TextField
              label="Supplier"
              variant="outlined"
              fullWidth
              value={itemSupplier}
              onChange={(e) => setItemSupplier(e.target.value)}
            />
            <Select
              label="Category"
              value={itemCategory}
              onChange={(e) => setItemCategory(e.target.value)}
              fullWidth
            >
              <MenuItem value="Food">Food</MenuItem>
              <MenuItem value="Beverage">Beverage</MenuItem>
              <MenuItem value="Cleaning">Cleaning</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
            <Button
              variant="outlined"
              onClick={() => {
                addItem(itemName, itemCategory, itemDescription, itemPrice, itemSupplier);
                clearForm();
                handleClose();
              }}
            >
              Add
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Modal
        open={editOpen}
        onClose={handleEditClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Edit Item
          </Typography>
          <Stack width="100%" spacing={2}>
            <TextField
              label="Item"
              variant="outlined"
              fullWidth
              value={itemName}
              disabled
            />
            <TextField
              label="Description"
              variant="outlined"
              fullWidth
              value={itemDescription}
              onChange={(e) => setItemDescription(e.target.value)}
            />
            <TextField
              label="Price"
              variant="outlined"
              fullWidth
              type="number"
              value={itemPrice}
              onChange={(e) => setItemPrice(e.target.value)}
            />
            <TextField
              label="Supplier"
              variant="outlined"
              fullWidth
              value={itemSupplier}
              onChange={(e) => setItemSupplier(e.target.value)}
            />
            <Select
              label="Category"
              value={itemCategory}
              onChange={(e) => setItemCategory(e.target.value)}
              fullWidth
            >
              <MenuItem value="Food">Food</MenuItem>
              <MenuItem value="Beverage">Beverage</MenuItem>
              <MenuItem value="Cleaning">Cleaning</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
            <Button
              variant="outlined"
              onClick={updateItemDetails}
            >
              Save
            </Button>
          </Stack>
        </Box>
      </Modal>

      <Modal
        open={viewOpen}
        onClose={handleViewClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={{ ...style, width: '80%', height: '80%', overflowY: 'auto' }}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            View All Items
          </Typography>
          <Stack width="100%" spacing={2}>
            {inventory.map(({ name, category, description, price, supplier }) => (
              <Box
                key={name}
                width="100%"
                minHeight="150px"
                display={'flex'}
                justifyContent={'space-between'}
                alignItems={'center'}
                bgcolor={'#f0f0f0'}
                paddingX={5}
              >
                <Box flex="1">
                  <Typography variant={'h3'} color={'#333'} textAlign={'left'}>
                    {name.charAt(0).toUpperCase() + name.slice(1)} ({category})
                  </Typography>
                  <Typography variant={'body1'} color={'#666'} textAlign={'left'}>
                    {description}
                  </Typography>
                  <Typography variant={'body1'} color={'#666'} textAlign={'left'}>
                    Price: ${price}
                  </Typography>
                  <Typography variant={'body1'} color={'#666'} textAlign={'left'}>
                    Supplier: {supplier}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Stack>
        </Box>
      </Modal>

      <Button variant="contained" onClick={handleOpen}>
        Add New Item
      </Button>

      <Button variant="contained" onClick={handleViewOpen} startIcon={<VisibilityIcon />}>
        View All Items
      </Button>

      <Box border={'1px solid #333'} width="100%" maxWidth="800px">
        <Box
          width="100%"
          height="100px"
          bgcolor={'#ADD8E6'}
          display={'flex'}
          justifyContent={'center'}
          alignItems={'center'}
        >
          <Typography variant={'h2'} color={'#333'} textAlign={'center'}>
            Inventory Items
          </Typography>
        </Box>
        <Stack width="100%" spacing={2} overflow={'auto'}>
          {filteredInventory.map(({ name, quantity, category, description, price, supplier }) => (
            <Box
              key={name}
              width="100%"
              minHeight="150px"
              display={'flex'}
              justifyContent={'space-between'}
              alignItems={'center'}
              bgcolor={'#f0f0f0'}
              paddingX={5}
            >
              <Box flex="1">
                <Typography variant={'h3'} color={'#333'} textAlign={'left'}>
                  {name.charAt(0).toUpperCase() + name.slice(1)} ({category})
                </Typography>
                <Typography variant={'body1'} color={'#666'} textAlign={'left'}>
                  {description}
                </Typography>
                <Typography variant={'body1'} color={'#666'} textAlign={'left'}>
                  Price: ${price}
                </Typography>
                <Typography variant={'body1'} color={'#666'} textAlign={'left'}>
                  Supplier: {supplier}
                </Typography>
              </Box>
              <Box display="flex" gap={2}>
                <Typography variant={'h3'} color={'#333'} textAlign={'center'}>
                  Quantity: {quantity}
                </Typography>
                <IconButton onClick={() => handleEditOpen({ name, category, description, price, supplier })}>
                  <EditIcon />
                </IconButton>
                <Button variant="contained" onClick={() => removeItem(name)}>
                  Remove
                </Button>
              </Box>
            </Box>
          ))}
        </Stack>
        <Button variant="text" onClick={() => updateInventory(true)} sx={{ alignSelf: 'center', marginY: 2 }}>
          Load More
        </Button>
      </Box>
    </Box>
  );
}
