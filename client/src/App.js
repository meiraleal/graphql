import React, { useState, useEffect } from "react";
import gql from "graphql-tag";
import { useQuery, useMutation, useSubscription } from "@apollo/react-hooks";

export const changeCompanyNameMutation = gql`
  mutation ChangeCompanyName($input: ChangeCompanyInput!) {
    changeCompanyName(input: $input) {
      id
      name
    }
  }
`;

const addCompanyMutation = gql`
  mutation AddCompany($name: String!) {
    addCompany(name: $name) {
      id
      name
    }
  }
`;
const deleteCompanyMutation = gql`
  mutation DeleteCompany($id: Int!) {
    deleteCompany(id: $id)
  }
`;

const useChangeCompanyNameMutation = () => {
  let [mutate] = useMutation(changeCompanyNameMutation);

  return ({ id, name }) => {
    mutate({
      variables: { input: { id, name } },
      optimisticResponse: {
        changeCompanyName: {
          __typename: "Company",
          id,
          name,
        },
      },
    });
  };
};

export const nameChangedSubscription = gql`
  subscription CompanyNameChanged {
    companyNameChanged {
      id
      name
    }
  }
`;

const useCompanyNameChanged = () => useSubscription(nameChangedSubscription);

export const companyAddedSubscription = gql`
  subscription CompanyAdded {
    companyAdded {
      id
      name
    }
  }
`;

const useCompanyAdded = () => useSubscription(companyAddedSubscription);

const query = gql`
  query Companies {
    companies {
      id
      name
    }
  }
`;

const useCompaniesQuery = () =>
  useQuery(query, {
    //pollInterval: 1000,
  });

const ChangeName = ({ company }) => {
  let changeName = useChangeCompanyNameMutation();
  let [name, setName] = useState(company.name);

  useEffect(() => {
    setName(company.name);
  }, [setName, company]);

  return (
    <>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={() => changeName({ id: company.id, name })}>
        Rename
      </button>
    </>
  );
};

const AddCompany = () => {
  let addCompany = useAddCompanyMutation();
  let [name, setName] = useState();

  useEffect(() => {
    setName(name);
  }, [setName, name]);
  return (
    <div>
      <input value={name} onChange={(e) => setName(e.target.value)} />
      <button onClick={() => addCompany(name)}>Add</button>
    </div>
  );
};

const useDeleteCompanyMutation = () => {
  let [deleteCompany] = useMutation(deleteCompanyMutation);
  return (id) => {
    return deleteCompany({
      variables: { id },
      update: (store) => {
        const data = store.readQuery({
          query,
        });

        store.writeQuery({
          query,
          data: {
            companies: data.companies.filter(
              (currentCompany) => currentCompany.id !== id
            ),
          },
        });
      },
    });
  };
};

const useAddCompanyMutation = () => {
  let [addCompany] = useMutation(addCompanyMutation);

  return (name) => {
    return addCompany({
      variables: { name },
    });
  };
};

const Companies = () => {
  useCompanyNameChanged();
  const companyAddedSubscription = useCompanyAdded();
  let { data, loading, error } = useCompaniesQuery();
  let deleteCompany = useDeleteCompanyMutation();

  if (!data || !data.companies) return null;
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Ereror :(</p>;
  if (companyAddedSubscription && companyAddedSubscription.data) {
    const companyAdded = companyAddedSubscription.data.companyAdded;    
    data.companies.push(companyAdded);
  }
  return (
    <div>
      {data.companies.map((company) => (
        <div key={company.id}>
          <h3>{company.name}</h3>
          <ChangeName company={company} />
          <button onClick={() => deleteCompany(company.id)}>Delete</button>
        </div>
      ))}
      <br />
      <hr />
      <br />
      <h1>add a new company</h1>
      <AddCompany />
    </div>
  );
};

const App = () => (
  <React.Fragment>
    <Companies />
  </React.Fragment>
);

export default App;
