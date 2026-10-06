import { useState, useEffect } from 'react';
import api from '../services/api';

const DEFAULT_DENTISTS = [
  { id: 3, name: "Dr. John Smith (Orthodontics)" },
  { id: 4, name: "Dr. Sarah Connor (Periodontics)" },
  { id: 5, name: "Dr. Michael Bluth (Endodontics)" },
  { id: 6, name: "Dr. Emily Watson (Pediatric Dentistry)" },
  { id: 7, name: "Dr. Robert Miller (Prosthodontics)" }
];

let cachedDentists = null;
let fetchPromise = null;

export const useDentists = () => {
  const [dentists, setDentists] = useState(cachedDentists || DEFAULT_DENTISTS);
  const [loading, setLoading] = useState(!cachedDentists);

  const fetchDentists = async (force = false) => {
    if (cachedDentists && !force) {
      setDentists(cachedDentists);
      setLoading(false);
      return cachedDentists;
    }

    if (!fetchPromise || force) {
      fetchPromise = api.get('/dentists')
        .then(res => {
          if (res.data && res.data.length > 0) {
            cachedDentists = res.data;
            return res.data;
          }
          return DEFAULT_DENTISTS;
        })
        .catch(err => {
          console.error("Could not fetch clinicians from API, using defaults:", err);
          return DEFAULT_DENTISTS;
        })
        .finally(() => {
          fetchPromise = null;
        });
    }

    const data = await fetchPromise;
    setDentists(data);
    setLoading(false);
    return data;
  };

  useEffect(() => {
    fetchDentists();
  }, []);

  return { dentists, loading, refetch: () => fetchDentists(true) };
};

export default useDentists;
